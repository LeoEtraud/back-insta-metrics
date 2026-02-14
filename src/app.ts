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
      console.log('[CORS] Requisição sem origin - permitindo');
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    
    // Verifica se a origem está na lista de permitidas
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('vercel.app') || // Permite qualquer subdomínio do Vercel
                     origin.includes('localhost'); // Permite localhost em qualquer porta
    
    if (isAllowed) {
      console.log(`[CORS] Origem permitida: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`[CORS] Origem bloqueada: ${origin}`);
      console.warn(`[CORS] Origens permitidas: ${allowedOrigins.join(', ')}`);
      // Em desenvolvimento, permite mesmo assim para debug
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CORS] Modo desenvolvimento - permitindo mesmo assim');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200, // Alguns navegadores antigos precisam disso
};

// APLICA CORS ANTES DE QUALQUER OUTRO MIDDLEWARE
app.use(cors(corsOptions));

// TRATA REQUISIÇÕES OPTIONS (PREFLIGHT) EXPLICITAMENTE PARA CORS
app.options('*', cors(corsOptions));

// ADICIONA HEADERS CORS MANUALMENTE PARA GARANTIR COMPATIBILIDADE
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  if (origin) {
    const allowedOrigins = getAllowedOrigins();
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('vercel.app') || 
                     origin.includes('localhost');
    
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
  }
  
  next();
});

// Logger middleware
app.use(logger);

export { app, httpServer };

