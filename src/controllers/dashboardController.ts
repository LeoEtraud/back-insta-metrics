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

  // Admin pode acessar dados de todas as empresas (por enquanto usa sua própria empresa se tiver)
  // Cliente só acessa dados da sua empresa
  const companyId = user.companyId;
  if (!companyId && user.role !== USER_ROLES.ADMIN) {
    return res.status(400).json({ message: "Usuário não associado a uma empresa" });
  }
  
  // Se for admin sem empresa, retorna dados vazios ou permite especificar empresaId via query
  // Por enquanto, admin precisa ter empresa associada
  if (!companyId) {
    return res.status(400).json({ message: "Usuário não associado a uma empresa" });
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

  // Admin pode acessar dados de todas as empresas (por enquanto usa sua própria empresa se tiver)
  // Cliente só acessa dados da sua empresa
  const companyId = user.companyId;
  if (!companyId && user.role !== USER_ROLES.ADMIN) {
    return res.status(400).json({ message: "Usuário não associado a uma empresa" });
  }
  
  // Se for admin sem empresa, retorna dados vazios ou permite especificar companyId via query
  // Por enquanto, admin precisa ter empresa associada
  if (!companyId) {
    return res.status(400).json({ message: "Usuário não associado a uma empresa" });
  }
  
  const trends = await storage.getDailyMetrics(companyId);
  res.json(trends);
});

