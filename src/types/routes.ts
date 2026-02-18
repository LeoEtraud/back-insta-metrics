import { z } from "zod";
import { 
  loginSchema, 
  type User,
  type Company,
  type InstagramPost,
  type DailyMetric
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  serverError: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: loginSchema,
        responses: {
        200: z.object({
          accessToken: z.string(),
          refreshToken: z.string(),
          user: z.custom<User>(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    refresh: {
      method: "POST" as const,
      path: "/api/auth/refresh",
      input: z.object({ refreshToken: z.string() }),
      responses: {
        200: z.object({ accessToken: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    forgotPassword: {
      method: "POST" as const,
      path: "/api/auth/forgot-password",
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    verifyResetCode: {
      method: "POST" as const,
      path: "/api/auth/verify-reset-code",
      input: z.object({ 
        email: z.string().email(),
        code: z.string().length(6).regex(/^\d+$/, "Código deve conter apenas números")
      }),
      responses: {
        200: z.object({ message: z.string(), valid: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
    resetPassword: {
      method: "POST" as const,
      path: "/api/auth/reset-password",
      input: z.object({ 
        email: z.string().email(),
        code: z.string().length(6).regex(/^\d+$/, "Código deve conter apenas números"),
        newPassword: z.string().min(6)
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  instagram: {
    connect: {
      method: "POST" as const,
      path: "/api/instagram/connect",
      input: z.object({ code: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
    posts: {
      method: "GET" as const,
      path: "/api/instagram/posts",
      responses: {
        200: z.array(z.custom<InstagramPost>()),
      },
    },
    sync: {
      method: "POST" as const,
      path: "/api/instagram/sync",
      responses: {
        200: z.object({ message: z.string(), count: z.number() }),
      },
    }
  },
  dashboard: {
    summary: {
      method: "GET" as const,
      path: "/api/dashboard/summary",
      responses: {
        200: z.object({
          totalFollowers: z.number(),
          avgEngagementRate: z.number(),
          totalReach: z.number(),
          totalPosts: z.number(),
        }),
      },
    },
    trends: {
      method: "GET" as const,
      path: "/api/dashboard/trends",
      responses: {
        200: z.array(z.custom<DailyMetric>()),
      },
    }
  },
  users: {
    list: {
      method: "GET" as const,
      path: "/api/users",
      responses: {
        200: z.array(z.custom<User>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/users/:id",
      input: z.object({ id: z.string() }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/users",
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        instagramUsername: z.string().optional(),
        role: z.enum(["admin", "cliente"]),
      }),
      responses: {
        201: z.custom<User>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/users/:id",
      input: z.object({
        id: z.string(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        name: z.string().min(1).optional(),
        instagramUsername: z.string().optional(),
        role: z.enum(["admin", "cliente"]).optional(),
      }),
      responses: {
        200: z.custom<User>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/users/:id",
      input: z.object({ id: z.string() }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

