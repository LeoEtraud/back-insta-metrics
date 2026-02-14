import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

// MIDDLEWARE DE TRATAMENTO DE ERROS - CAPTURA E FORMATA ERROS (ZOD, JWT, ETC) PARA RESPOSTA HTTP
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  // Default error
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json({ message });
}

