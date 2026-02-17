import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
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

// CONFIGURAÇÃO CORS - PERMITE COMUNICAÇÃO COM FRONTEND (LOCAL E PRODUÇÃO)
// DEVE SER O PRIMEIRO MIDDLEWARE ANTES DE QUALQUER OUTRO
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [
    "http://localhost:3000",
    "http://localhost:5173", // Vite dev server alternativo
    "https://front-insta-metrics.vercel.app", // Frontend em produção
  ];
  
  // Adiciona FRONTEND_URL se estiver definido
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
    // Também adiciona sem protocolo se necessário
    if (!process.env.FRONTEND_URL.startsWith('http')) {
      origins.push(`https://${process.env.FRONTEND_URL}`);
      origins.push(`http://${process.env.FRONTEND_URL}`);
    }
  }
  
  // Adiciona URLs do Vercel (produção e preview)
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  return origins;
};

// FUNÇÃO PARA VERIFICAR SE A ORIGEM É PERMITIDA
const isOriginAllowed = (origin: string | undefined): boolean => {
  // Permite requisições sem origin (ex: Postman, mobile apps, server-side)
  if (!origin) {
    return true;
  }
  
  const allowedOrigins = getAllowedOrigins();
  
  // Verifica se a origem está na lista de permitidas
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Permite qualquer subdomínio vercel.app (produção e preview)
  if (origin.includes('vercel.app')) {
    return true;
  }
  
  // Permite localhost em qualquer porta (desenvolvimento)
  if (origin.includes('localhost')) {
    return true;
  }
  
  return false;
};

// MIDDLEWARE CORS CUSTOMIZADO - GARANTE COMPATIBILIDADE COM RENDER E VERCEL
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Permite a origem se for válida
  if (isOriginAllowed(origin)) {
    // Se há origin, usa ela; caso contrário, permite qualquer origem
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Sem origin, permite qualquer origem mas sem credentials
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  } else {
    // Log para debug em produção
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[CORS] Origem bloqueada: ${origin}`);
    }
  }
  
  // Responde imediatamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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

// Logger middleware
app.use(logger);

export { app, httpServer };

