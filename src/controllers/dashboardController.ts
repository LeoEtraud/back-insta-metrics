import type { Response } from "express";
import { storage } from "../services/storage";
import { asyncHandler } from "../utils/asyncHandler";
import { resolveCompanyId } from "../utils/companyResolver";
import type { AuthRequest } from "../middlewares/auth";

// RETORNA RESUMO DAS MÉTRICAS DO DASHBOARD (SEGUIDORES, ALCANCE, POSTS, TAXA DE ENGAJAMENTO)
export const getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resolved = await resolveCompanyId(req);
  if (!resolved) {
    return res.status(400).json({
      message:
        "companyId é obrigatório na query string (admin) ou usuário deve estar vinculado a uma empresa.",
    });
  }
  const summary = await storage.getDashboardSummary(resolved.companyId);
  res.json(summary);
});

// RETORNA AS MÉTRICAS DIÁRIAS PARA ANÁLISE DE TENDÊNCIAS
export const getTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resolved = await resolveCompanyId(req);
  if (!resolved) {
    return res.status(400).json({
      message:
        "companyId é obrigatório na query string (admin) ou usuário deve estar vinculado a uma empresa.",
    });
  }
  const trends = await storage.getDailyMetrics(resolved.companyId);
  res.json(trends);
});

