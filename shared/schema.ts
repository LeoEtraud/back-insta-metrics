import { z } from "zod";
import { Prisma } from "@prisma/client";

// Re-export Prisma types
export type User = Prisma.UserGetPayload<{}>;
export type Company = Prisma.CompanyGetPayload<{}>;
export type InstagramPost = Prisma.InstagramPostGetPayload<{}>;
export type DailyMetric = Prisma.DailyMetricGetPayload<{}>;
export type RefreshToken = Prisma.RefreshTokenGetPayload<{}>;

// Insert types
export type InsertUser = Prisma.UserCreateInput;
export type InsertCompany = Prisma.CompanyCreateInput;
export type InsertPost = Prisma.InstagramPostCreateInput;
export type InsertDailyMetric = Prisma.DailyMetricCreateInput;

// Constants
export const USER_ROLES = {
  ADMIN_SAAS: "admin_saas",
  ADMIN_COMPANY: "admin_company",
  ANALYST: "analyst",
  VIEWER: "viewer",
} as const;

export const POST_TYPES = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  CAROUSEL_ALBUM: "CAROUSEL_ALBUM",
  REELS: "REELS",
} as const;

// Zod Schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPayload {
  userId: number;
  role: string;
  companyId: number | null;
}
