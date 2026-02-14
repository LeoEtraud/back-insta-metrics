import type { Response } from "express";
import { storage } from "../services/storage";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";

// RETORNA RESUMO DAS MÉTRICAS DO DASHBOARD (SEGUIDORES, ALCANCE, POSTS, TAXA DE ENGAJAMENTO)
export const getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(400).json({ message: "User not associated with a company" });
  }
  
  const summary = await storage.getDashboardSummary(companyId);
  res.json(summary);
});

// RETORNA AS MÉTRICAS DIÁRIAS PARA ANÁLISE DE TENDÊNCIAS
export const getTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(400).json({ message: "User not associated with a company" });
  }

  const trends = await storage.getDailyMetrics(companyId);
  res.json(trends);
});

