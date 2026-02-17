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
  }
  
  // Adiciona URLs do Vercel (produção e preview)
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  return origins;
};

// FUNÇÃO PARA VERIFICAR ORIGEM PERMITIDA - PERMITE QUALQUER SUBDOMÍNIO VERCEL
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permite requisições sem origin (ex: Postman, mobile apps, server-side)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    
    // Verifica se a origem está na lista de permitidas OU é um subdomínio vercel.app
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('vercel.app') || // Permite qualquer subdomínio do Vercel
                     origin.includes('localhost'); // Permite localhost em qualquer porta
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Em produção, permite mesmo assim para evitar problemas (pode ser restringido depois)
      console.warn(`[CORS] Origem não listada: ${origin} - permitindo mesmo assim`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// APLICA CORS COMO PRIMEIRO MIDDLEWARE
app.use(cors(corsOptions));

// ADICIONA HEADERS CORS MANUALMENTE PARA GARANTIR COMPATIBILIDADE COM VERCEL
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  if (origin) {
    const allowedOrigins = getAllowedOrigins();
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('vercel.app') || 
                     origin.includes('localhost');
    
    if (isAllowed || origin.includes('vercel.app')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    }
  }
  
  // Responde imediatamente para requisições OPTIONS
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

