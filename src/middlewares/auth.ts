import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { USER_ROLES } from "../types/schema";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "dev-access-secret-key-123";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

// MIDDLEWARE DE AUTENTICAÇÃO - VERIFICA E VALIDA O TOKEN JWT NO HEADER AUTHORIZATION
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    (req as AuthRequest).user = decoded;
    next();
  });
}

// MIDDLEWARE DE AUTORIZAÇÃO - VERIFICA SE O USUÁRIO É ADMINISTRADOR
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (authReq.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores podem acessar este recurso." });
  }

  next();
}

