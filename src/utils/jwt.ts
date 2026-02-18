import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "dev-access-secret-key-123";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret-key-123";

export interface TokenPayload {
  userId: number;
  role?: string;
}

// GERA TOKEN JWT DE ACESSO COM EXPIRAÇÃO DE 15 MINUTOS
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

// GERA TOKEN JWT DE REFRESH COM EXPIRAÇÃO DE 7 DIAS
export function generateRefreshToken(payload: { userId: number }): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// VERIFICA E VALIDA TOKEN JWT DE ACESSO - RETORNA PAYLOAD OU LANÇA ERRO
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
}

// VERIFICA E VALIDA TOKEN JWT DE REFRESH - RETORNA USERID OU LANÇA ERRO
export function verifyRefreshToken(token: string): { userId: number } {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: number };
}

