import type { Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";

export const getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(400).json({ message: "User not associated with a company" });
  }
  
  const summary = await storage.getDashboardSummary(companyId);
  res.json(summary);
});

export const getTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(400).json({ message: "User not associated with a company" });
  }

  const trends = await storage.getDailyMetrics(companyId);
  res.json(trends);
});

