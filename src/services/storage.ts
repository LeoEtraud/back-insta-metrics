import { prisma } from "./db";
import { 
  type User, type InsertUser, type Company, type InstagramPost, type DailyMetric, USER_ROLES
} from "../types/schema";

export interface IStorage {
  // User & Auth
  getUserByEmail(email: string): Promise<User | null>;
  getUserByInstagramUsername(username: string): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(data: { email: string; name: string; provider: string; providerId: string }): Promise<User>;
  updateUserProvider(id: number, provider: string, providerId: string): Promise<void>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | null>;
  
  // User Management (CRUD)
  getAllUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Refresh Tokens
  storeRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getRefreshToken(token: string): Promise<{ userId: number, expiresAt: Date, revoked: boolean | null } | null>;
  revokeRefreshToken(token: string): Promise<void>;

  // Company
  getCompany(id: number): Promise<Company | null>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(name: string): Promise<Company>;
  updateCompanyInstagram(
    companyId: number,
    data: {
      instagramAccessToken: string | null;
      instagramBusinessAccountId: string | null;
      instagramUsername: string | null;
      instagramTokenExpiresAt: Date | null;
    }
  ): Promise<void>;
  
  // Instagram Data
  getPosts(companyId: number): Promise<InstagramPost[]>;
  createPost(post: InsertPost): Promise<InstagramPost>;
  upsertPost(companyId: number, post: { instagramId: string; mediaType: string; mediaUrl?: string; permalink?: string; caption?: string; timestamp: Date; metrics?: Record<string, number> }): Promise<InstagramPost>;
  getDailyMetrics(companyId: number): Promise<DailyMetric[]>;
  createDailyMetric(metric: InsertDailyMetric): Promise<DailyMetric>;
  upsertDailyMetric(companyId: number, date: Date, data: { followersCount?: number; reach?: number; impressions?: number; profileViews?: number }): Promise<DailyMetric>;
  
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

  // BUSCA USUÁRIO PELO INSTAGRAM USERNAME
  async getUserByInstagramUsername(username: string): Promise<User | null> {
    if (!username) return null;
    return await prisma.user.findUnique({
      where: { instagramUsername: username },
    });
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
        role: USER_ROLES.CLIENT,
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

  // LISTA TODOS OS USUÁRIOS
  async getAllUsers(): Promise<User[]> {
    return await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // BUSCA USUÁRIO PELO ID
  async getUserById(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  // ATUALIZA DADOS DO USUÁRIO
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  // DELETA USUÁRIO DO BANCO DE DADOS
  async deleteUser(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
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

  // LISTA TODAS AS EMPRESAS (PARA ADMIN)
  async getAllCompanies(): Promise<Company[]> {
    return await prisma.company.findMany({ orderBy: { name: "asc" } });
  }

  // CRIA NOVA EMPRESA NO BANCO DE DADOS
  async createCompany(name: string): Promise<Company> {
    return await prisma.company.create({ data: { name } });
  }

  // ATUALIZA DADOS DO INSTAGRAM NA EMPRESA (APÓS OAUTH OU DESCONEXÃO)
  async updateCompanyInstagram(
    companyId: number,
    data: {
      instagramAccessToken: string | null;
      instagramBusinessAccountId: string | null;
      instagramUsername: string | null;
      instagramTokenExpiresAt: Date | null;
    }
  ): Promise<void> {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        instagramAccessToken: data.instagramAccessToken,
        instagramBusinessAccountId: data.instagramBusinessAccountId,
        instagramUsername: data.instagramUsername,
        instagramTokenExpiresAt: data.instagramTokenExpiresAt,
      },
    });
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

  // UPSERT POST POR INSTAGRAM ID (CRIA OU ATUALIZA)
  async upsertPost(
    companyId: number,
    post: {
      instagramId: string;
      mediaType: string;
      mediaUrl?: string;
      permalink?: string;
      caption?: string;
      timestamp: Date;
      metrics?: Record<string, number>;
    }
  ): Promise<InstagramPost> {
    const metrics = post.metrics ?? { likes: 0, comments: 0 };
    return await prisma.instagramPost.upsert({
      where: { instagramId: post.instagramId },
      create: {
        companyId,
        instagramId: post.instagramId,
        mediaType: post.mediaType,
        mediaUrl: post.mediaUrl,
        permalink: post.permalink,
        caption: post.caption,
        timestamp: post.timestamp,
        metrics,
      },
      update: {
        mediaType: post.mediaType,
        mediaUrl: post.mediaUrl,
        permalink: post.permalink,
        caption: post.caption,
        timestamp: post.timestamp,
        metrics,
        lastUpdated: new Date(),
      },
    });
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

  // UPSERT MÉTRICA DIÁRIA POR COMPANY E DATA
  async upsertDailyMetric(
    companyId: number,
    date: Date,
    data: { followersCount?: number; reach?: number; impressions?: number; profileViews?: number }
  ): Promise<DailyMetric> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existing = await prisma.dailyMetric.findFirst({
      where: {
        companyId,
        date: { gte: dayStart, lt: dayEnd },
      },
    });

    if (existing) {
      return await prisma.dailyMetric.update({
        where: { id: existing.id },
        data: {
          ...(data.followersCount !== undefined && { followersCount: data.followersCount }),
          ...(data.reach !== undefined && { reach: data.reach }),
          ...(data.impressions !== undefined && { impressions: data.impressions }),
          ...(data.profileViews !== undefined && { profileViews: data.profileViews }),
        },
      });
    }

    return await prisma.dailyMetric.create({
      data: {
        companyId,
        date: dayStart,
        followersCount: data.followersCount ?? 0,
        reach: data.reach ?? 0,
        impressions: data.impressions ?? 0,
        profileViews: data.profileViews ?? 0,
      },
    });
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
