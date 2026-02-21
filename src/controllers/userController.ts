import type { Response } from "express";
import { storage } from "../services/storage";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";
import { USER_ROLES } from "../types/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";

// VALIDAÇÃO DO PADRÃO DO INSTAGRAM USERNAME
// Permite apenas: letras minúsculas (a-z), números (0-9), ponto (.) e underscore (_)
// Não pode começar ou terminar com ponto ou underscore
// Não pode ter pontos ou underscores consecutivos
const instagramUsernameSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true; // Permite vazio
      // Remove o @ se presente
      const username = val.replace(/^@/, "").trim();
      // Verifica se contém apenas caracteres permitidos (a-z, 0-9, ., _)
      const validPattern = /^[a-z0-9._]+$/;
      if (!validPattern.test(username)) return false;
      // Não pode começar ou terminar com ponto ou underscore
      if (/^[._]|[._]$/.test(username)) return false;
      // Não pode ter pontos ou underscores consecutivos
      if (/[._]{2,}/.test(username)) return false;
      // Deve ter pelo menos 1 caractere alfanumérico
      if (!/[a-z0-9]/.test(username)) return false;
      return true;
    },
    {
      message:
        "Nome de usuário do Instagram inválido. Use apenas letras minúsculas, números, ponto (.) e underscore (_). Não pode começar ou terminar com ponto ou underscore.",
    }
  );

// SCHEMAS DE VALIDAÇÃO
const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  instagramUsername: instagramUsernameSchema,
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.CLIENT], {
    errorMap: () => ({ message: "Role deve ser 'admin' ou 'cliente'" }),
  }),
  companyId: z.number().int().positive().optional().nullable(),
});

const updateUserSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  instagramUsername: instagramUsernameSchema,
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.CLIENT], {
    errorMap: () => ({ message: "Role deve ser 'admin' ou 'cliente'" }),
  }).optional(),
  companyId: z.number().int().positive().optional().nullable(),
});

// LISTA USUÁRIOS COM FILTRO DE PERMISSÃO (ADMIN: TODOS, CLIENTE: APENAS DA SUA EMPRESA)
export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Admin vê todos os usuários, Cliente vê todos (sem filtro de empresa)
  const users = await storage.getAllUsers();
  res.json(users);
});

// OBTÉM USUÁRIO ESPECÍFICO COM VERIFICAÇÃO DE PERMISSÃO
export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "ID de usuário inválido" });
  }

  const targetUser = await storage.getUserById(userId);
  if (!targetUser) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  // Cliente só pode ver o próprio usuário
  if (user.role === USER_ROLES.CLIENT) {
    if (targetUser.id !== user.userId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
  }

  res.json(targetUser);
});

// CRIA NOVO USUÁRIO (APENAS ADMIN)
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ message: "Apenas administradores podem criar usuários" });
  }

  const data = createUserSchema.parse(req.body);

  // Verifica se email já existe
  const existingUser = await storage.getUserByEmail(data.email);
  if (existingUser) {
    return res.status(400).json({ message: "Email já cadastrado" });
  }

  // Normaliza instagramUsername (remove @ e converte para minúsculas)
  let normalizedUsername: string | null = null;
  if (data.instagramUsername) {
    normalizedUsername = data.instagramUsername.replace(/^@/, "").trim().toLowerCase();
    if (normalizedUsername === "") normalizedUsername = null;
  }

  // Verifica se instagramUsername já existe (se fornecido)
  if (normalizedUsername) {
    const existingUsername = await storage.getUserByInstagramUsername(normalizedUsername);
    if (existingUsername) {
      return res.status(400).json({ message: "Nome de usuário do Instagram já está em uso" });
    }
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Valida companyId se fornecido (deve existir)
  if (data.companyId) {
    const company = await storage.getCompany(data.companyId);
    if (!company) {
      return res.status(400).json({ message: "Empresa não encontrada" });
    }
  }

  // Cria usuário
  const createData = {
    email: data.email,
    password: hashedPassword,
    name: data.name,
    instagramUsername: normalizedUsername,
    role: data.role,
    provider: "local",
    ...(data.companyId != null && { company: { connect: { id: data.companyId } } }),
  };
  const newUser = await storage.createUser(createData);

  // Busca usuário criado com relacionamentos
  const userWithRelations = await storage.getUserById(newUser.id);
  res.status(201).json(userWithRelations);
});

// ATUALIZA USUÁRIO (COM VERIFICAÇÃO DE PERMISSÃO)
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "ID de usuário inválido" });
  }

  let data = updateUserSchema.parse(req.body);

  // Verifica se usuário existe
  const targetUser = await storage.getUserById(userId);
  if (!targetUser) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  // Normaliza instagramUsername (remove @ e converte para minúsculas)
  let normalizedUsername: string | null = null;
  if (data.instagramUsername !== undefined) {
    if (data.instagramUsername) {
      normalizedUsername = data.instagramUsername.replace(/^@/, "").trim().toLowerCase();
      if (normalizedUsername === "") normalizedUsername = null;
    } else {
      normalizedUsername = null;
    }
  }

  // Verifica se instagramUsername já está em uso por outro usuário (se fornecido e diferente do atual)
  if (normalizedUsername !== null && normalizedUsername !== targetUser.instagramUsername) {
    const existingUsername = await storage.getUserByInstagramUsername(normalizedUsername);
    if (existingUsername && existingUsername.id !== userId) {
      return res.status(400).json({ message: "Nome de usuário do Instagram já está em uso" });
    }
  }

  // Verifica permissões
  // Cliente só pode editar o próprio usuário
  if (user.role === USER_ROLES.CLIENT) {
    if (targetUser.id !== user.userId) {
      return res.status(403).json({ message: "Você só pode editar seu próprio perfil" });
    }
    // Cliente não pode alterar role
    if (data.role !== undefined) {
      return res.status(403).json({ message: "Você não tem permissão para alterar role" });
    }
  }

  // Verifica se email já existe (se estiver sendo alterado)
  if (data.email && data.email !== targetUser.email) {
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }
  }

  // Cliente editando próprio perfil: ignora instagramUsername do body (nunca sobrescreve)
  const isClientEditingSelf = user.role === USER_ROLES.CLIENT && targetUser.id === user.userId;
  if (isClientEditingSelf) {
    delete (data as Record<string, unknown>).instagramUsername;
  }

  // Prepara dados para atualização
  const updateData: Record<string, unknown> = {};
  if (data.email) updateData.email = data.email;
  if (data.name) updateData.name = data.name;
  // instagramUsername: apenas admin pode alterar quando envia explicitamente
  if (user.role === USER_ROLES.ADMIN && data.instagramUsername !== undefined) {
    updateData.instagramUsername = normalizedUsername;
  }
  // Para cliente: NUNCA incluir instagramUsername em updateData (Prisma preserva valor existente)
  if (isClientEditingSelf) {
    delete updateData.instagramUsername;
  }
  if (data.role && user.role === USER_ROLES.ADMIN) updateData.role = data.role;
  if (data.companyId !== undefined && user.role === USER_ROLES.ADMIN) {
    if (data.companyId !== null) {
      const company = await storage.getCompany(data.companyId);
      if (!company) {
        return res.status(400).json({ message: "Empresa não encontrada" });
      }
    }
    updateData.companyId = data.companyId;
  }

  // Hash da senha se fornecida
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const updatedUser = await storage.updateUser(userId, updateData);
  res.json(updatedUser);
});

// DELETA USUÁRIO (APENAS ADMIN)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ message: "Apenas administradores podem deletar usuários" });
  }

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "ID de usuário inválido" });
  }

  // Não permite deletar a si mesmo
  if (userId === user.userId) {
    return res.status(400).json({ message: "Você não pode deletar seu próprio usuário" });
  }

  // Verifica se usuário existe
  const targetUser = await storage.getUserById(userId);
  if (!targetUser) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  await storage.deleteUser(userId);
  res.json({ message: "Usuário deletado com sucesso" });
});

