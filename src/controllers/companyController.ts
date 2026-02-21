import type { Request, Response } from "express";
import { storage } from "../services/storage";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";
import { USER_ROLES } from "../types/schema";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

// LISTA TODAS AS EMPRESAS (APENAS ADMIN)
export const listCompanies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user || user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ message: "Apenas administradores podem listar empresas" });
  }
  const companies = await storage.getAllCompanies();
  res.json(companies);
});

// CRIA NOVA EMPRESA (APENAS ADMIN)
export const createCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user || user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ message: "Apenas administradores podem criar empresas" });
  }
  const data = createCompanySchema.parse(req.body);
  const company = await storage.createCompany(data.name);
  res.status(201).json(company);
});
