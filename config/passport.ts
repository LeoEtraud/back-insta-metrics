import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import { storage } from "../storage";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { USER_ROLES } from "../shared/schema";

// Serialização do usuário para sessão (não usamos sessão, mas Passport requer)
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Estratégia Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔵 [GOOGLE OAUTH] Perfil recebido:", {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
        });

        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.name?.givenName || "User";
        const providerId = profile.id;

        if (!email) {
          console.error("❌ [GOOGLE OAUTH] Email não encontrado no perfil");
          return done(new Error("Email não encontrado no perfil do Google"), null);
        }

        console.log("🔍 [GOOGLE OAUTH] Buscando usuário por email:", email);

        // Busca usuário existente por email ou providerId
        let user = await storage.getUserByEmail(email);
        
        if (user) {
          console.log("✅ [GOOGLE OAUTH] Usuário encontrado:", {
            id: user.id,
            provider: user.provider,
            providerId: user.providerId,
          });

          // Se usuário existe mas não tem provider, atualiza
          if (!user.provider || user.provider === "local") {
            console.log("🔄 [GOOGLE OAUTH] Atualizando provider do usuário");
            await storage.updateUserProvider(user.id, "google", providerId);
            user = await storage.getUser(user.id);
          }
        } else {
          console.log("➕ [GOOGLE OAUTH] Criando novo usuário OAuth");
          // Cria novo usuário OAuth
          user = await storage.createOAuthUser({
            email,
            name,
            provider: "google",
            providerId,
          });
          console.log("✅ [GOOGLE OAUTH] Usuário criado:", { id: user.id, email: user.email });
        }

        // Gera tokens
        const tokenData = {
          userId: user!.id,
          role: user!.role,
          companyId: user!.companyId,
        };

        const jwtAccessToken = generateAccessToken(tokenData);
        const jwtRefreshToken = generateRefreshToken({ userId: user!.id });

        await storage.storeRefreshToken(
          user!.id,
          jwtRefreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );

        console.log("✅ [GOOGLE OAUTH] Tokens gerados com sucesso");
        console.log("📤 [GOOGLE OAUTH] Retornando dados para callback");

        return done(null, {
          user,
          accessToken: jwtAccessToken,
          refreshToken: jwtRefreshToken,
        });
      } catch (error: any) {
        console.error("❌ [GOOGLE OAUTH] Erro:", error);
        return done(error, null);
      }
    }
  )
);

// Estratégia Microsoft OAuth
passport.use(
  "microsoft",
  new OAuth2Strategy(
    {
      authorizationURL: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      clientID: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || "/api/auth/microsoft/callback",
      scope: "openid profile email",
    },
    async (accessToken, refreshToken, params: any, done) => {
      try {
        // Busca informações do usuário usando o access token
        const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          return done(new Error("Falha ao obter informações do usuário da Microsoft"), null);
        }

        const userInfo = await userInfoResponse.json();
        const email = userInfo.mail || userInfo.userPrincipalName;
        const name = userInfo.displayName || userInfo.givenName || "User";
        const providerId = userInfo.id;

        if (!email) {
          return done(new Error("Email não encontrado no perfil da Microsoft"), null);
        }

        // Busca usuário existente por email ou providerId
        let user = await storage.getUserByEmail(email);
        
        if (user) {
          // Se usuário existe mas não tem provider, atualiza
          if (!user.provider || user.provider === "local") {
            await storage.updateUserProvider(user.id, "microsoft", providerId);
            user = await storage.getUser(user.id);
          }
        } else {
          // Cria novo usuário OAuth
          user = await storage.createOAuthUser({
            email,
            name,
            provider: "microsoft",
            providerId,
          });
        }

        // Gera tokens
        const tokenData = {
          userId: user!.id,
          role: user!.role,
          companyId: user!.companyId,
        };

        const jwtAccessToken = generateAccessToken(tokenData);
        const jwtRefreshToken = generateRefreshToken({ userId: user!.id });

        await storage.storeRefreshToken(
          user!.id,
          jwtRefreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );

        return done(null, {
          user,
          accessToken: jwtAccessToken,
          refreshToken: jwtRefreshToken,
        });
      } catch (error: any) {
        return done(error, null);
      }
    }
  )
);

export default passport;

