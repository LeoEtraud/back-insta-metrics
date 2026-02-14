import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import passport from "./config/passport";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { registerRoutes } from "./routes";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Middlewares
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Passport initialization
app.use(passport.initialize());

// CONFIGURAÇÃO CORS - PERMITE COMUNICAÇÃO COM FRONTEND (LOCAL E PRODUÇÃO)
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [
    "http://localhost:3000",
    "http://localhost:5173", // Vite dev server alternativo
  ];
  
  // Adiciona FRONTEND_URL se estiver definido
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Adiciona URLs do Vercel (produção e preview)
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  // Adiciona URL padrão do Vercel se conhecida
  origins.push("https://front-insta-metrics.vercel.app");
  
  return origins;
};

// FUNÇÃO PARA VERIFICAR ORIGEM PERMITIDA
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permite requisições sem origin (ex: Postman, mobile apps, server-side)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    
    // Verifica se a origem está na lista de permitidas
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('vercel.app') || // Permite qualquer subdomínio do Vercel
                     origin.includes('localhost'); // Permite localhost em qualquer porta
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origem bloqueada: ${origin}. Permitidas: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// Logger middleware
app.use(logger);

export { app, httpServer };

