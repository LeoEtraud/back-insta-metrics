import type { Response } from "express";
import { storage } from "../services/storage";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";
import { USER_ROLES } from "../types/schema";

// RETORNA RESUMO DAS MÉTRICAS DO DASHBOARD (SEGUIDORES, ALCANCE, POSTS, TAXA DE ENGAJAMENTO)
export const getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Obtém companyId da query string (admin pode especificar, cliente deve especificar)
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : null;
  
  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({ message: "companyId é obrigatório na query string" });
  }
  
  const summary = await storage.getDashboardSummary(companyId);
  res.json(summary);
});

// RETORNA AS MÉTRICAS DIÁRIAS PARA ANÁLISE DE TENDÊNCIAS
export const getTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Obtém companyId da query string (admin pode especificar, cliente deve especificar)
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : null;
  
  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({ message: "companyId é obrigatório na query string" });
  }
  
  const trends = await storage.getDailyMetrics(companyId);
  res.json(trends);
});

