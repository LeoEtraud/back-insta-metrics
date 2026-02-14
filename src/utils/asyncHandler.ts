import type { Request, Response, NextFunction } from "express";

// WRAPPER PARA FUNÇÕES ASSÍNCRONAS - CAPTURA ERROS E ENVIA PARA O MIDDLEWARE DE ERRO
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next?: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};

