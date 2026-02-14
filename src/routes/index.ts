import type { Express } from "express";
import { createServer, type Server } from "http";
import { api } from "../types/routes";
import { authenticateToken } from "../middlewares/auth";
import * as authController from "../controllers/authController";
import * as oauthController from "../controllers/oauthController";
import * as dashboardController from "../controllers/dashboardController";
import * as instagramController from "../controllers/instagramController";

// REGISTRA TODAS AS ROTAS DA APLICAÇÃO NO EXPRESS - AUTENTICAÇÃO, OAUTH, DASHBOARD E INSTAGRAM
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Routes (Public)
  app.post(api.auth.forgotPassword.path, authController.forgotPassword);
  app.post(api.auth.verifyResetCode.path, authController.verifyResetCode);
  app.post(api.auth.resetPassword.path, authController.resetPassword);
  app.post(api.auth.login.path, authController.login);
  app.post(api.auth.refresh.path, authController.refresh);
  
  // OAuth Routes
  app.get("/api/auth/google", oauthController.googleAuth);
  app.get("/api/auth/google/callback", oauthController.googleCallback);
  app.get("/api/auth/microsoft", oauthController.microsoftAuth);
  app.get("/api/auth/microsoft/callback", oauthController.microsoftCallback);
  
  // Auth Routes (Protected)
  app.get(api.auth.me.path, authenticateToken, authController.me);

  // Dashboard Routes (Protected)
  app.get(api.dashboard.summary.path, authenticateToken, dashboardController.getSummary);
  app.get(api.dashboard.trends.path, authenticateToken, dashboardController.getTrends);

  // Instagram Routes (Protected)
  app.get(api.instagram.posts.path, authenticateToken, instagramController.getPosts);
  app.post(api.instagram.sync.path, authenticateToken, instagramController.syncPosts);

  return httpServer;
}

