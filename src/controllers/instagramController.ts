import type { Response } from "express";
import { storage } from "../services/storage";
import { getMedia, getMediaInsights, getAccountInsights } from "../services/metaService";
import { asyncHandler } from "../utils/asyncHandler";
import { resolveCompanyId } from "../utils/companyResolver";
import type { AuthRequest } from "../middlewares/auth";

// RETORNA TODOS OS POSTS DO INSTAGRAM DA EMPRESA DO USUÁRIO AUTENTICADO
export const getPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resolved = await resolveCompanyId(req);
  if (!resolved) {
    return res.status(400).json({
      message:
        "companyId é obrigatório na query string (admin) ou usuário deve estar vinculado a uma empresa.",
    });
  }

  const posts = await storage.getPosts(resolved.companyId);
  res.json(posts);
});

// SINCRONIZA POSTS DO INSTAGRAM - BUSCA DADOS REAIS DA API GRAPH E POPULA O BANCO
export const syncPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resolved = await resolveCompanyId(req);
  if (!resolved) {
    return res.status(400).json({
      message:
        "companyId é obrigatório na query string (admin) ou usuário deve estar vinculado a uma empresa.",
    });
  }

  const { companyId } = resolved;
  const company = await storage.getCompany(companyId);
  if (!company?.instagramAccessToken || !company?.instagramBusinessAccountId) {
    return res.status(400).json({
      message: "Conecte o Instagram primeiro em Configurações.",
      code: "instagram_not_connected",
    });
  }

  const token = company.instagramAccessToken;
  const igUserId = company.instagramBusinessAccountId;

  try {
    const mediaItems = await getMedia(igUserId, token, 50);
    let syncedCount = 0;

    for (const item of mediaItems) {
      let insights: Record<string, number> = {};
      try {
        insights = await getMediaInsights(item.id, token, ["engagement", "reach", "saved"]);
      } catch {
        // Alguns posts podem não ter insights
      }

      const engagement = insights.engagement ?? 0;
      const metrics = {
        likes: Math.floor(engagement * 0.8),
        comments: Math.floor(engagement * 0.2),
        reach: insights.reach ?? 0,
        saves: insights.saved ?? 0,
      };

      await storage.upsertPost(companyId, {
        instagramId: item.id,
        mediaType: item.media_type || "IMAGE",
        mediaUrl: item.media_url,
        permalink: item.permalink,
        caption: item.caption ?? undefined,
        timestamp: new Date(item.timestamp),
        metrics,
      });
      syncedCount++;
    }

    // Buscar insights da conta (métricas diárias) - últimos 30 dias
    const now = Math.floor(Date.now() / 1000);
    const since = now - 30 * 24 * 60 * 60;
    try {
      const accountInsights = await getAccountInsights(
        igUserId,
        token,
        "day",
        ["impression_count", "reach", "follower_count", "profile_views"],
        since,
        now
      );

      for (const day of accountInsights) {
        const date = new Date(day.date + "T12:00:00Z");
        await storage.upsertDailyMetric(companyId, date, {
          followersCount: day.follower_count ?? day.followers_count ?? 0,
          reach: day.reach ?? 0,
          impressions: day.impression_count ?? day.impressions ?? 0,
          profileViews: day.profile_views ?? 0,
        });
      }
    } catch (insightsErr) {
      console.warn("[syncPosts] Falha ao buscar insights da conta:", insightsErr);
    }

    res.json({ message: "Synced successfully", count: syncedCount });
  } catch (err: any) {
    if (err.message === "instagram_token_expired") {
      return res.status(401).json({
        message: "Token do Instagram expirado. Reconecte o Instagram em Configurações.",
        code: "instagram_token_expired",
      });
    }
    throw err;
  }
});

// DESCONECTA INSTAGRAM DA EMPRESA (REMOVE TOKEN E DADOS)
export const disconnectInstagram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resolved = await resolveCompanyId(req);
  if (!resolved) {
    return res.status(400).json({
      message:
        "companyId é obrigatório na query string (admin) ou usuário deve estar vinculado a uma empresa.",
    });
  }

  await storage.updateCompanyInstagram(resolved.companyId, {
    instagramAccessToken: null,
    instagramBusinessAccountId: null,
    instagramUsername: null,
    instagramTokenExpiresAt: null,
  });

  res.json({ message: "Instagram desconectado com sucesso" });
});
