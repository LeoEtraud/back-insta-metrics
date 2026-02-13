import type { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { api } from "../shared/routes";
import { USER_ROLES } from "../shared/schema";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";
import { sendPasswordResetCode } from "../utils/email";

// Gera código de 6 dígitos numéricos
const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = api.auth.forgotPassword.input.parse(req.body);
  const user = await storage.getUserByEmail(email);
  
  if (user) {
    // Gera código de 6 dígitos
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    
    // Salva código no banco
    await storage.setUserResetCode(email, code, expiresAt);
    
    // Verifica se email está configurado
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    // Envia email com código
    try {
      await sendPasswordResetCode(email, code);
      console.log(`✅ Processo de recuperação iniciado para: ${email}`);
    } catch (error: any) {
      console.error("\n❌ Erro crítico ao enviar email de recuperação");
      console.error("Email:", email);
      console.error("Código gerado:", code);
      console.error("Erro completo:", error);
      
      // Em caso de erro, ainda retorna sucesso para não expor se o email existe
      // Mas em desenvolvimento, podemos ser mais verbosos
      if (process.env.NODE_ENV === "development") {
        console.error("\n⚠️  ATENÇÃO: O código foi gerado e salvo no banco, mas o email não foi enviado.");
        console.error("💡 Você pode usar o código diretamente:", code);
        console.error("💡 Ou verificar os logs acima para corrigir o problema de envio.\n");
      }
      
      // Não retorna erro para o cliente (segurança)
      // O código já foi salvo no banco, então o usuário pode tentar usar mesmo sem receber o email
    }
  }
  
  // Always return 200 security best practice
  res.json({ message: "Se o email existir, um código de recuperação foi enviado." });
});

export const verifyResetCode = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = api.auth.verifyResetCode.input.parse(req.body);
  
  const user = await storage.getUserByEmail(email);
  if (!user) {
    return res.status(400).json({ message: "Email não encontrado" });
  }
  
  const userWithCode = await storage.getUserByResetCode(code);
  if (!userWithCode || userWithCode.email !== email) {
    return res.status(400).json({ message: "Código inválido ou expirado" });
  }
  
  res.json({ message: "Código válido", valid: true });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, code, newPassword } = api.auth.resetPassword.input.parse(req.body);
  
  // Valida código
  const user = await storage.getUserByEmail(email);
  if (!user) {
    return res.status(400).json({ message: "Email não encontrado" });
  }
  
  const userWithCode = await storage.getUserByResetCode(code);
  if (!userWithCode || userWithCode.email !== email) {
    return res.status(400).json({ message: "Código inválido ou expirado" });
  }
  
  // Atualiza senha
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await storage.updateUserPassword(user.id, hashedPassword);
  
  // Se o usuário era OAuth e não tinha senha, agora pode fazer login com senha também
  // O provider permanece o mesmo, mas agora ele tem senha definida
  
  res.json({ message: "Senha atualizada com sucesso" });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = api.auth.login.input.parse(req.body);
  const user = await storage.getUserByEmail(input.email);
  
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Se o usuário tem provider OAuth mas não tem senha definida
  if (user.provider && user.provider !== "local" && !user.password) {
    const providerName = user.provider === "google" ? "Google" : user.provider === "microsoft" ? "Microsoft" : "login social";
    return res.status(401).json({ 
      message: `Esta conta foi criada via ${providerName}. Para fazer login com email e senha, primeiro defina uma senha usando "Esqueci minha senha". Ou use o botão de login ${providerName} acima.`,
      oauthProvider: user.provider
    });
  }

  // Verifica senha (funciona para usuários locais e OAuth que têm senha)
  if (!user.password || !(await bcrypt.compare(input.password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
  });
  const refreshToken = generateRefreshToken({ userId: user.id });

  await storage.storeRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  res.json({ accessToken, refreshToken, user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

  const storedToken = await storage.getRefreshToken(refreshToken);
  if (!storedToken || storedToken.revoked) {
    return res.status(403).json({ message: "Invalid or revoked refresh token" });
  }

  try {
    const { verifyRefreshToken } = await import("../utils/jwt");
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });
    
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  res.json(user);
});

