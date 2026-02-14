import type { Request, Response } from "express";
import passport from "passport";
import "../config/passport";

// INICIA PROCESSO DE AUTENTICAÇÃO COM GOOGLE OAUTH
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// PROCESSA CALLBACK DO GOOGLE OAUTH - RECEBE DADOS DO USUÁRIO E REDIRECIONA COM TOKENS
export const googleCallback = (req: Request, res: Response) => {
  passport.authenticate("google", { session: false }, (err: any, data: any) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    if (err) {
      console.error("❌ [GOOGLE CALLBACK] Erro na autenticação:", err);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(err.message || "Erro desconhecido")}`);
    }

    if (!data) {
      console.error("❌ [GOOGLE CALLBACK] Dados não retornados");
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=no_data`);
    }

    const { accessToken, refreshToken, user } = data;
    
    console.log("✅ [GOOGLE CALLBACK] Autenticação bem-sucedida:", {
      userId: user?.id,
      email: user?.email,
      hasToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
    
    // Redireciona para o frontend com tokens na URL (será capturado pelo frontend)
    const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
    
    console.log("📤 [GOOGLE CALLBACK] Redirecionando para:", redirectUrl.replace(/token=[^&]+/, "token=***"));
    
    res.redirect(redirectUrl);
  })(req, res);
};

// INICIA PROCESSO DE AUTENTICAÇÃO COM MICROSOFT OAUTH
export const microsoftAuth = passport.authenticate("microsoft", {
  scope: ["openid", "profile", "email"],
});

// PROCESSA CALLBACK DO MICROSOFT OAUTH - RECEBE DADOS DO USUÁRIO E REDIRECIONA COM TOKENS
export const microsoftCallback = (req: Request, res: Response) => {
  passport.authenticate("microsoft", { session: false }, (err: any, data: any) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    if (err) {
      console.error("❌ [MICROSOFT CALLBACK] Erro na autenticação:", err);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(err.message || "Erro desconhecido")}`);
    }

    if (!data) {
      console.error("❌ [MICROSOFT CALLBACK] Dados não retornados");
      return res.redirect(`${frontendUrl}/login?error=oauth_failed&message=no_data`);
    }

    const { accessToken, refreshToken, user } = data;
    
    console.log("✅ [MICROSOFT CALLBACK] Autenticação bem-sucedida:", {
      userId: user?.id,
      email: user?.email,
      hasToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
    
    // Redireciona para o frontend com tokens na URL
    const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
    
    console.log("📤 [MICROSOFT CALLBACK] Redirecionando para:", redirectUrl.replace(/token=[^&]+/, "token=***"));
    
    res.redirect(redirectUrl);
  })(req, res);
};

