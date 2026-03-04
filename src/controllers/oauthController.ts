import type { Request, Response } from "express";
import passport from "passport";
import "../config/passport";
import { storage } from "../services/storage";
import { USER_ROLES } from "../types/schema";
import { exchangeCodeForToken, getLongLivedToken, getPagesWithInstagram } from "../services/metaService";
import { signOAuthState, verifyOAuthState } from "../utils/jwt";
import type { AuthRequest } from "../middlewares/auth";

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
  // User.Read é necessário para acessar o Microsoft Graph API
  scope: ["openid", "profile", "email", "https://graph.microsoft.com/User.Read"],
});

// ========== META (FACEBOOK) OAUTH - INSTAGRAM ==========

const META_SCOPES =
  "pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights";

// DIAGNÓSTICO: RETORNA O QUE O BACKEND ESTÁ USANDO (SÓ ADMIN) - PARA CONFERIR COM O PAINEL META
export const metaCheck = async (req: AuthRequest, res: Response) => {
  const appId = process.env.META_APP_ID;
  const callbackUrl = process.env.META_CALLBACK_URL;
  const configured = !!(appId && callbackUrl);
  res.json({
    configured,
    redirectUri: callbackUrl || null,
    appIdSuffix: appId ? `...${appId.slice(-4)}` : null,
    hint: "redirectUri deve ser EXATAMENTE igual em Meta for Developers → Login do Facebook → Configurações → URIs de redirecionamento",
  });
};

// INICIA FLUXO OAUTH META - GERA STATE E REDIRECIONA PARA LOGIN FACEBOOK
export const metaAuthStart = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const companyIdParam = req.query.companyId as string | undefined;
  const companyId = companyIdParam ? parseInt(companyIdParam, 10) : null;

  let resolvedCompanyId: number;

  if (companyId && !isNaN(companyId)) {
    // Admin pode passar qualquer companyId; cliente só pode usar o próprio
    if (user.role !== USER_ROLES.ADMIN) {
      const dbUser = await storage.getUser(user.userId);
      if (!dbUser?.companyId || dbUser.companyId !== companyId) {
        return res.status(403).json({ message: "Sem permissão para esta empresa" });
      }
    }
    resolvedCompanyId = companyId;
  } else {
    // Inferir do user
    const dbUser = await storage.getUser(user.userId);
    if (!dbUser?.companyId) {
      return res.status(400).json({
        message:
          "companyId é obrigatório. Usuários cliente precisam estar vinculados a uma empresa.",
      });
    }
    resolvedCompanyId = dbUser.companyId;
  }

  const company = await storage.getCompany(resolvedCompanyId);
  if (!company) {
    return res.status(404).json({ message: "Empresa não encontrada" });
  }

  const appId = process.env.META_APP_ID;
  const callbackUrl = process.env.META_CALLBACK_URL;
  if (!appId || !callbackUrl) {
    return res.status(500).json({
      message: "Integração com Instagram não configurada. Contate o administrador.",
    });
  }

  // State como JWT assinado (não usa memória — funciona quando o servidor reinicia, ex.: Render)
  const state = signOAuthState({ companyId: resolvedCompanyId, userId: user.userId });

  const authUrl =
    "https://www.facebook.com/v20.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(META_SCOPES)}` +
    `&state=${encodeURIComponent(state)}`;

  // Debug: confira no log se scope e redirect_uri batem com o app na Meta
  console.log("[META] /api/auth/meta/start → URL gerada (scope e redirect_uri):", {
    scope: META_SCOPES,
    redirect_uri: callbackUrl,
    url: authUrl.replace(state, "<state>"),
  });

  res.status(200).json({ url: authUrl });
};

// CALLBACK OAUTH META - RECEBE CODE, TROCA POR TOKEN, SALVA NA COMPANY
export const metaCallback = async (req: Request, res: Response) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const errorParam = req.query.error as string | undefined;

  if (errorParam) {
    const msg = req.query.error_description as string | undefined;
    return res.redirect(`${frontendUrl}/settings?instagram_error=${encodeURIComponent(msg || errorParam)}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/settings?instagram_error=missing_code_or_state`);
  }

  let companyId: number;
  try {
    const payload = verifyOAuthState(state);
    companyId = payload.companyId;
  } catch {
    return res.redirect(`${frontendUrl}/settings?instagram_error=state_expired`);
  }

  try {
    const tokenRes = await exchangeCodeForToken(code);
    console.log("[META] callback: code trocado por user token (curto) com sucesso");

    const longLived = await getLongLivedToken(tokenRes.accessToken);
    console.log("[META] callback: token long-lived obtido, expira em", longLived.expiresIn, "s");

    const pages = await getPagesWithInstagram(longLived.accessToken);

    if (pages.length === 0) {
      console.warn("[META] callback: /me/accounts retornou 0 páginas com IG → no_linked_page");
      return res.redirect(
        `${frontendUrl}/settings?instagram_error=no_linked_page`
      );
    }

    const first = pages[0];
    console.log("[META] callback: página/IG selecionada:", { pageId: first.pageId, igUserId: first.igUserId, username: first.username });

    const expiresAt = longLived.expiresIn
      ? new Date(Date.now() + longLived.expiresIn * 1000)
      : null;

    await storage.updateCompanyInstagram(companyId, {
      instagramAccessToken: longLived.accessToken,
      instagramBusinessAccountId: first.igUserId,
      instagramUsername: first.username,
      instagramTokenExpiresAt: expiresAt,
    });

    return res.redirect(`${frontendUrl}/settings?instagram_connected=1`);
  } catch (err: any) {
    console.error("[META] callback erro:", err?.message || err);
    const msg = err.message || "Erro ao conectar Instagram";
    const isTokenExpired = msg.includes("instagram_token_expired") || msg.includes("Reconecte");
    const query = isTokenExpired ? "instagram_token_expired" : encodeURIComponent(msg);
    return res.redirect(`${frontendUrl}/settings?instagram_error=${query}`);
  }
};

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

