import { prisma } from "./db";
import { 
  type User, type InsertUser, type Company, type InstagramPost, type DailyMetric, USER_ROLES
} from "./shared/schema";

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
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { email } });
  }

  async setUserResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpires: expiresAt },
    });
  }

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

  async setUserResetCode(email: string, code: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { resetCode: code, resetCodeExpires: expiresAt },
    });
  }

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

  async getUser(id: number): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }

  async createUser(user: InsertUser): Promise<User> {
    return await prisma.user.create({ data: user });
  }

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

  async updateUserProvider(id: number, provider: string, providerId: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { provider, providerId },
    });
  }

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

  async getRefreshToken(token: string) {
    const rt = await prisma.refreshToken.findUnique({ where: { token } });
    if (!rt) return null;
    return {
      userId: rt.userId,
      expiresAt: rt.expiresAt,
      revoked: rt.revoked,
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  async getCompany(id: number): Promise<Company | null> {
    return await prisma.company.findUnique({ where: { id } });
  }

  async createCompany(name: string): Promise<Company> {
    return await prisma.company.create({ data: { name } });
  }

  async getPosts(companyId: number): Promise<InstagramPost[]> {
    return await prisma.instagramPost.findMany({
      where: { companyId },
      orderBy: { timestamp: "desc" },
    });
  }

  async createPost(post: InsertPost): Promise<InstagramPost> {
    return await prisma.instagramPost.create({ data: post });
  }

  async getDailyMetrics(companyId: number): Promise<DailyMetric[]> {
    return await prisma.dailyMetric.findMany({
      where: { companyId },
      orderBy: { date: "asc" },
    });
  }

  async createDailyMetric(metric: InsertDailyMetric): Promise<DailyMetric> {
    return await prisma.dailyMetric.create({ data: metric });
  }

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
