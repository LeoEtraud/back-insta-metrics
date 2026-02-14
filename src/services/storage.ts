import { prisma } from "./db";
import { 
  type User, type InsertUser, type Company, type InstagramPost, type DailyMetric, USER_ROLES
} from "../types/schema";

export interface IStorage {
  // User & Auth
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(data: { email: string; name: string; provider: string; providerId: string }): Promise<User>;
  updateUserProvider(id: number, provider: string, providerId: string): Promise<void>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | null>;
  
  // Refresh Tokens
  storeRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getRefreshToken(token: string): Promise<{ userId: number, expiresAt: Date, revoked: boolean | null } | null>;
  revokeRefreshToken(token: string): Promise<void>;

  // Company
  getCompany(id: number): Promise<Company | null>;
  createCompany(name: string): Promise<Company>;
  
  // Instagram Data
  getPosts(companyId: number): Promise<InstagramPost[]>;
  createPost(post: InsertPost): Promise<InstagramPost>;
  getDailyMetrics(companyId: number): Promise<DailyMetric[]>;
  createDailyMetric(metric: InsertDailyMetric): Promise<DailyMetric>;
  
  // Dashboard Aggregates
  getDashboardSummary(companyId: number): Promise<{
    totalFollowers: number;
    totalReach: number;
    totalPosts: number;
    avgEngagementRate: number;
  }>;

  // Recovery
  setUserResetToken(email: string, token: string, expiresAt: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | null>;
  setUserResetCode(email: string, code: string, expiresAt: Date): Promise<void>;
  getUserByResetCode(code: string): Promise<User | null>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;
}

type InsertPost = {
  companyId: number;
  instagramId: string;
  mediaType: string;
  mediaUrl?: string | null;
  permalink?: string | null;
  caption?: string | null;
  timestamp: Date;
  metrics?: any;
};

type InsertDailyMetric = {
  companyId: number;
  date: Date;
  followersCount?: number;
  reach?: number;
  impressions?: number;
  profileViews?: number;
};

export class DatabaseStorage implements IStorage {
  // BUSCA USUÁRIO NO BANCO DE DADOS PELO EMAIL
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { email } });
  }

  // SALVA TOKEN DE REDEFINIÇÃO DE SENHA NO BANCO DE DADOS ASSOCIADO AO EMAIL
  async setUserResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpires: expiresAt },
    });
  }

  // BUSCA USUÁRIO PELO TOKEN DE REDEFINIÇÃO DE SENHA (VÁLIDO E NÃO EXPIRADO)
  async getUserByResetToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });
    return user;
  }

  // SALVA CÓDIGO DE 6 DÍGITOS DE REDEFINIÇÃO DE SENHA NO BANCO DE DADOS
  async setUserResetCode(email: string, code: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { resetCode: code, resetCodeExpires: expiresAt },
    });
  }

  // BUSCA USUÁRIO PELO CÓDIGO DE REDEFINIÇÃO DE SENHA (VÁLIDO E NÃO EXPIRADO)
  async getUserByResetCode(code: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        resetCode: code,
        resetCodeExpires: {
          gt: new Date(),
        },
      },
    });
    return user;
  }

  // ATUALIZA A SENHA DO USUÁRIO E LIMPA TOKENS/CÓDIGOS DE REDEFINIÇÃO
  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { 
        password: passwordHash, 
        resetToken: null, 
        resetTokenExpires: null,
        resetCode: null,
        resetCodeExpires: null
      },
    });
  }

  // BUSCA USUÁRIO NO BANCO DE DADOS PELO ID
  async getUser(id: number): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }

  // CRIA NOVO USUÁRIO NO BANCO DE DADOS
  async createUser(user: InsertUser): Promise<User> {
    return await prisma.user.create({ data: user });
  }

  // CRIA NOVO USUÁRIO OAUTH (GOOGLE/MICROSOFT) NO BANCO DE DADOS SEM SENHA
  async createOAuthUser(data: { email: string; name: string; provider: string; providerId: string }): Promise<User> {
    return await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: null, // Usuários OAuth não têm senha
        provider: data.provider,
        providerId: data.providerId,
        role: USER_ROLES.ADMIN_COMPANY,
      },
    });
  }

  // ATUALIZA O PROVEDOR OAUTH (GOOGLE/MICROSOFT) DO USUÁRIO
  async updateUserProvider(id: number, provider: string, providerId: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { provider, providerId },
    });
  }

  // BUSCA USUÁRIO PELO ID DO PROVEDOR OAUTH (GOOGLE/MICROSOFT)
  async getUserByProviderId(provider: string, providerId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }

  // ARMAZENA TOKEN DE REFRESH NO BANCO DE DADOS PARA RENOVAÇÃO DE TOKENS
  async storeRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        revoked: false,
      },
    });
  }

  // BUSCA TOKEN DE REFRESH NO BANCO DE DADOS E RETORNA DADOS DO USUÁRIO
  async getRefreshToken(token: string) {
    const rt = await prisma.refreshToken.findFirst({ where: { token } });
    if (!rt) return null;
    return {
      userId: rt.userId,
      expiresAt: rt.expiresAt,
      revoked: rt.revoked,
    };
  }

  // REVOCA TOKEN DE REFRESH MARCADO COMO INVALIDO NO BANCO DE DADOS
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
  }

  // BUSCA EMPRESA NO BANCO DE DADOS PELO ID
  async getCompany(id: number): Promise<Company | null> {
    return await prisma.company.findUnique({ where: { id } });
  }

  // CRIA NOVA EMPRESA NO BANCO DE DADOS
  async createCompany(name: string): Promise<Company> {
    return await prisma.company.create({ data: { name } });
  }

  // BUSCA TODOS OS POSTS DO INSTAGRAM DA EMPRESA ORDENADOS POR DATA (MAIS RECENTES PRIMEIRO)
  async getPosts(companyId: number): Promise<InstagramPost[]> {
    return await prisma.instagramPost.findMany({
      where: { companyId },
      orderBy: { timestamp: "desc" },
    });
  }

  // CRIA NOVO POST DO INSTAGRAM NO BANCO DE DADOS
  async createPost(post: InsertPost): Promise<InstagramPost> {
    return await prisma.instagramPost.create({ data: post });
  }

  // BUSCA MÉTRICAS DIÁRIAS DA EMPRESA ORDENADAS POR DATA (MAIS ANTIGAS PRIMEIRO)
  async getDailyMetrics(companyId: number): Promise<DailyMetric[]> {
    return await prisma.dailyMetric.findMany({
      where: { companyId },
      orderBy: { date: "asc" },
    });
  }

  // CRIA NOVA MÉTRICA DIÁRIA NO BANCO DE DADOS
  async createDailyMetric(metric: InsertDailyMetric): Promise<DailyMetric> {
    return await prisma.dailyMetric.create({ data: metric });
  }

  // CALCULA E RETORNA RESUMO DAS MÉTRICAS DO DASHBOARD (SEGUIDORES, ALCANCE, POSTS, TAXA DE ENGAJAMENTO)
  async getDashboardSummary(companyId: number) {
    // Get latest daily metric for followers/reach
    const latestMetric = await prisma.dailyMetric.findFirst({
      where: { companyId },
      orderBy: { date: "desc" },
    });

    // Count posts
    const totalPosts = await prisma.instagramPost.count({
      where: { companyId },
    });

    // Calculate avg engagement (likes + comments) / followers
    const recentPosts = await this.getPosts(companyId);
    let totalEngagement = 0;
    recentPosts.forEach(p => {
      const metrics = p.metrics as any;
      totalEngagement += (metrics.likes || 0) + (metrics.comments || 0);
    });
    
    const avgEngagement = recentPosts.length > 0 ? (totalEngagement / recentPosts.length) : 0;
    // Engagement Rate = Avg Engagement / Followers
    const followers = latestMetric?.followersCount || 1;
    const engagementRate = (avgEngagement / followers) * 100;

    return {
      totalFollowers: latestMetric?.followersCount || 0,
      totalReach: latestMetric?.reach || 0,
      totalPosts,
      avgEngagementRate: parseFloat(engagementRate.toFixed(2)),
    };
  }
}

export const storage = new DatabaseStorage();
