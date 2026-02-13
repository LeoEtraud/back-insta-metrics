import type { Express } from "express";
import { createServer, type Server } from "http";
import { api } from "./shared/routes";
import { authenticateToken } from "./middlewares/auth";
import * as authController from "./controllers/authController";
import * as dashboardController from "./controllers/dashboardController";
import * as instagramController from "./controllers/instagramController";

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
