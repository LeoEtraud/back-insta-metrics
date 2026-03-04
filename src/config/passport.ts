import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import { storage } from "../services/storage";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { USER_ROLES } from "../types/schema";

// SERIALIZA USUÁRIO PARA SESSÃO (NÃO USAMOS SESSÃO, MAS PASSPORT REQUER)
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// DESERIALIZA USUÁRIO DA SESSÃO (NÃO USAMOS SESSÃO, MAS PASSPORT REQUER)
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// CONFIGURA ESTRATÉGIA DE AUTENTICAÇÃO GOOGLE OAUTH - SÓ REGISTRA SE CREDENCIAIS ESTIVEREM CONFIGURADAS
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
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
          return done(new Error("Email não encontrado no perfil do Google"), false);
        }

        console.log("🔍 [GOOGLE OAUTH] Buscando usuário por email:", email);

        // Busca usuário existente por email
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          console.log("❌ [GOOGLE OAUTH] Usuário não encontrado no banco de dados");
          return done(new Error("Usuário não cadastrado. Por favor, cadastre-se primeiro antes de usar login social."), false);
        }

        console.log("✅ [GOOGLE OAUTH] Usuário encontrado:", {
          id: user.id,
          provider: user.provider,
          providerId: user.providerId,
          hasPassword: !!user.password,
        });

        // Se o usuário tem provider "local" e senha, permite manter ambos os métodos
        // Atualiza o provider para "google" mas mantém a senha
        if (!user.provider || user.provider === "local") {
          console.log("🔄 [GOOGLE OAUTH] Atualizando provider do usuário para Google");
          await storage.updateUserProvider(user.id, "google", providerId);
          user = await storage.getUser(user.id);
          console.log("✅ [GOOGLE OAUTH] Usuário pode fazer login com Google e também com senha (se tiver senha definida)");
        } else if (user.provider !== "google") {
          // Se o usuário já tem outro provider, permite mas mantém o provider original
          console.log("⚠️ [GOOGLE OAUTH] Usuário já tem outro provider:", user.provider);
        } else {
          console.log("✅ [GOOGLE OAUTH] Usuário já configurado para Google");
        }

        // Gera tokens
        const tokenData = {
          userId: user!.id,
          role: user!.role,
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
        return done(error, false);
      }
    }
  )
  );
  console.log("✅ [PASSPORT] Google OAuth configurado");
} else {
  console.log("⚠️ [PASSPORT] Google OAuth não configurado (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET ausentes)");
}

// CONFIGURA ESTRATÉGIA DE AUTENTICAÇÃO MICROSOFT OAUTH - SÓ REGISTRA SE CREDENCIAIS ESTIVEREM CONFIGURADAS
const microsoftClientId = process.env.MICROSOFT_CLIENT_ID?.trim();
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET?.trim();

if (microsoftClientId && microsoftClientSecret) {
  passport.use(
    "microsoft",
    new OAuth2Strategy(
      {
        authorizationURL: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        clientID: microsoftClientId,
        clientSecret: microsoftClientSecret,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL || "/api/auth/microsoft/callback",
        scope: "openid profile email https://graph.microsoft.com/User.Read",
      },
    async (accessToken: string, refreshToken: string, params: any, done: (error: any, user?: any) => void) => {
      try {
        console.log("🔵 [MICROSOFT OAUTH] Token recebido, buscando informações do usuário...");
        
        // ✅ USA MICROSOFT GRAPH API (API moderna e suportada)
        // ❌ NÃO USA graph.windows.net (Azure AD Graph - descontinuada)
        const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text();
          let errorMessage = "Falha ao obter informações do usuário da Microsoft";
          
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) {
              errorMessage = errorJson.error.message;
            } else if (errorJson.error?.code) {
              errorMessage = `Erro ${errorJson.error.code}: ${errorMessage}`;
            }
          } catch (e) {
            // Se não conseguir parsear, usa a mensagem padrão
          }
          
          console.error("❌ [MICROSOFT OAUTH] Erro ao buscar informações do usuário:", {
            status: userInfoResponse.status,
            statusText: userInfoResponse.statusText,
            error: errorText,
            message: errorMessage,
          });
          
          // Mensagem mais específica para erro 403
          if (userInfoResponse.status === 403) {
            errorMessage = "Permissão negada. Verifique se a aplicação tem a permissão 'User.Read' configurada no Azure Portal e se o usuário consentiu com as permissões.";
          }
          
          return done(new Error(errorMessage), false);
        }

        const userInfo = await userInfoResponse.json() as {
          mail?: string;
          userPrincipalName?: string;
          displayName?: string;
          givenName?: string;
          id: string;
        };
        
        console.log("🔵 [MICROSOFT OAUTH] Perfil recebido:", {
          id: userInfo.id,
          displayName: userInfo.displayName,
          mail: userInfo.mail,
          userPrincipalName: userInfo.userPrincipalName,
        });
        
        const email = userInfo.mail || userInfo.userPrincipalName;
        const name = userInfo.displayName || userInfo.givenName || "User";
        const providerId = userInfo.id;

        if (!email) {
          console.error("❌ [MICROSOFT OAUTH] Email não encontrado no perfil");
          return done(new Error("Email não encontrado no perfil da Microsoft"), false);
        }

        console.log("🔍 [MICROSOFT OAUTH] Buscando usuário por email:", email);

        // Busca usuário existente por email
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          console.log("❌ [MICROSOFT OAUTH] Usuário não encontrado no banco de dados");
          return done(new Error("Usuário não cadastrado. Por favor, cadastre-se primeiro antes de usar login social."), false);
        }

        console.log("✅ [MICROSOFT OAUTH] Usuário encontrado:", {
          id: user.id,
          provider: user.provider,
          providerId: user.providerId,
          hasPassword: !!user.password,
        });

        // Se o usuário tem provider "local" e senha, permite manter ambos os métodos
        // Atualiza o provider para "microsoft" mas mantém a senha
        if (!user.provider || user.provider === "local") {
          console.log("🔄 [MICROSOFT OAUTH] Atualizando provider do usuário para Microsoft");
          await storage.updateUserProvider(user.id, "microsoft", providerId);
          user = await storage.getUser(user.id);
          console.log("✅ [MICROSOFT OAUTH] Usuário pode fazer login com Microsoft e também com senha (se tiver senha definida)");
        } else if (user.provider !== "microsoft") {
          // Se o usuário já tem outro provider, permite mas mantém o provider original
          console.log("⚠️ [MICROSOFT OAUTH] Usuário já tem outro provider:", user.provider);
        } else {
          console.log("✅ [MICROSOFT OAUTH] Usuário já configurado para Microsoft");
        }

        // Gera tokens
        const tokenData = {
          userId: user!.id,
          role: user!.role,
        };

        const jwtAccessToken = generateAccessToken(tokenData);
        const jwtRefreshToken = generateRefreshToken({ userId: user!.id });

        await storage.storeRefreshToken(
          user!.id,
          jwtRefreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );

        console.log("✅ [MICROSOFT OAUTH] Tokens gerados com sucesso");
        console.log("📤 [MICROSOFT OAUTH] Retornando dados para callback");

        return done(null, {
          user,
          accessToken: jwtAccessToken,
          refreshToken: jwtRefreshToken,
        });
      } catch (error: any) {
        console.error("❌ [MICROSOFT OAUTH] Erro:", error);
        return done(error, false);
      }
    }
  )
  );
  console.log("✅ [PASSPORT] Microsoft OAuth configurado");
} else {
  console.log("⚠️ [PASSPORT] Microsoft OAuth não configurado (MICROSOFT_CLIENT_ID e MICROSOFT_CLIENT_SECRET ausentes)");
}

export default passport;

