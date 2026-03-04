import type { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "../services/storage";
import { api } from "../types/routes";
import { USER_ROLES } from "../types/schema";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";
import { sendPasswordResetCode } from "../utils/email";

// GERA CÓDIGO DE 6 DÍGITOS NUMÉRICOS PARA RECUPERAÇÃO DE SENHA
const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// PROCESSA SOLICITAÇÃO DE RECUPERAÇÃO DE SENHA - GERA E ENVIA CÓDIGO DE 6 DÍGITOS POR EMAIL
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = api.auth.forgotPassword.input.parse(req.body);
  
  // Verifica se o email existe no sistema ANTES de gerar o código
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    return res.status(400).json({ message: "Email não cadastrado no sistema" });
  }
  
  // Gera código de 6 dígitos
  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  
  // Salva código no banco
  await storage.setUserResetCode(email, code, expiresAt);
  
  // Verifica se email está configurado (Resend ou SMTP tradicional)
  const resendApiKey = process.env.RESEND_API_KEY;
  const hasResend = !!(resendApiKey && resendApiKey.trim().length > 0);
  const hasSmtp = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  const emailConfigured = hasResend || hasSmtp;
  
  // Logs de debug para verificar variáveis de ambiente
  console.log(`🔍 [DEBUG] Verificando configuração de email:`);
  console.log(`   RESEND_API_KEY existe: ${!!resendApiKey}`);
  console.log(`   RESEND_API_KEY tem valor: ${hasResend}`);
  console.log(`   EMAIL_USER existe: ${!!process.env.EMAIL_USER}`);
  console.log(`   EMAIL_PASS existe: ${!!process.env.EMAIL_PASS}`);
  console.log(`   Email configurado: ${emailConfigured}`);
  
  if (!emailConfigured) {
    console.warn("⚠️  EMAIL não configurado - código gerado mas não será enviado");
    console.warn(`💡 Código gerado para ${email}: ${code}`);
    console.warn(`💡 Configure no Render:`);
    console.warn(`   Opção 1 (Recomendado): RESEND_API_KEY=re_sua_chave_aqui`);
    console.warn(`   Opção 2: EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT`);
    return res.status(500).json({ 
      message: "Serviço de email não configurado. Entre em contato com o suporte." 
    });
  }
  
  // Log qual serviço está sendo usado
  if (hasResend) {
    console.log(`📧 ✅ Usando Resend API para envio de email`);
    console.log(`   API Key prefix: ${resendApiKey?.substring(0, 3)}...`);
  } else {
    console.log(`📧 ⚠️  Usando SMTP (${process.env.EMAIL_HOST || "smtp.gmail.com"}) - Resend não detectado`);
    console.log(`   💡 Para usar Resend, configure RESEND_API_KEY no Render`);
  }

  try {
    const timeoutMs = 28000; // 28s para não exceder limite típico do Render
    const sendPromise = sendPasswordResetCode(email, code);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao enviar email. Tente novamente.")), timeoutMs)
    );
    await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ [EMAIL] Processo de recuperação concluído para: ${email}`);
    return res.json({ message: "Código de recuperação enviado para seu email." });
  } catch (error: any) {
    console.error("\n❌ [EMAIL ERROR] Falha ao enviar email de recuperação");
    console.error("Email:", email);
    console.error("Erro:", error.message);
    console.error("💡 Se usar Resend com onboarding@resend.dev, só é possível enviar para o e-mail da sua conta Resend. Verifique um domínio em resend.com/domains e use RESEND_FROM_EMAIL com esse domínio.\n");
    return res.status(500).json({
      message: "Não foi possível enviar o e-mail de recuperação. Verifique se o serviço de e-mail está configurado corretamente no servidor ou tente novamente mais tarde.",
    });
  }
});

// VERIFICA SE O CÓDIGO DE RECUPERAÇÃO DE SENHA É VÁLIDO E ESTÁ ASSOCIADO AO EMAIL
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

// REDEFINE A SENHA DO USUÁRIO APÓS VALIDAÇÃO DO CÓDIGO DE RECUPERAÇÃO
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

// AUTENTICA USUÁRIO COM EMAIL E SENHA - RETORNA TOKENS DE ACESSO E REFRESH
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
  });
  const refreshToken = generateRefreshToken({ userId: user.id });

  await storage.storeRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  res.json({ accessToken, refreshToken, user });
});

// RENOVA O TOKEN DE ACESSO USANDO O TOKEN DE REFRESH VÁLIDO
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
    });
    
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
});

// RETORNA OS DADOS DO USUÁRIO AUTENTICADO ATUAL (INCLUI COMPANY QUANDO VINCULADO)
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

  let company = null;
  if (user.companyId) {
    company = await storage.getCompany(user.companyId);
    if (company) {
      company = {
        id: company.id,
        name: company.name,
        instagramBusinessAccountId: company.instagramBusinessAccountId,
        instagramUsername: company.instagramUsername,
        instagramTokenExpiresAt: company.instagramTokenExpiresAt,
      };
    }
  }

  res.json({ ...user, company });
});

