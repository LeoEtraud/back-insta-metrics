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

// CONFIGURAÇÃO CORS RESTRITA - APENAS URLs ESPECÍFICAS DO FRONTEND E BACKEND
// DEVE SER O PRIMEIRO MIDDLEWARE ANTES DE QUALQUER OUTRO
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [
    // Desenvolvimento local
    "http://localhost:3000",
    "http://localhost:5173", // Vite dev server alternativo
    
    // Produção - Frontend específico
    "https://front-insta-metrics.vercel.app",
  ];
  
  // Adiciona FRONTEND_URL se estiver definido (permite configuração via variável de ambiente)
  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.trim();
    // Remove trailing slash se houver
    const cleanUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
    
    // Adiciona com protocolo correto
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      origins.push(cleanUrl);
    } else {
      // Se não tiver protocolo, adiciona https
      origins.push(`https://${cleanUrl}`);
    }
  }
  
  // Remove duplicatas e ordena
  const uniqueOrigins = Array.from(new Set(origins));
  console.log(`[CORS] Origens permitidas (restritas):`, uniqueOrigins);
  return uniqueOrigins;
};

// FUNÇÃO PARA VERIFICAR SE A ORIGEM É PERMITIDA - APENAS URLs ESPECÍFICAS
const isOriginAllowed = (origin: string | undefined): boolean => {
  // Permite requisições sem origin (ex: Postman, mobile apps, server-side)
  if (!origin) {
    return true;
  }
  
  const allowedOrigins = getAllowedOrigins();
  
  // Verifica se a origem está EXATAMENTE na lista de permitidas (verificação estrita)
  return allowedOrigins.includes(origin);
};

// MIDDLEWARE CORS CUSTOMIZADO - GARANTE COMPATIBILIDADE COM RENDER E VERCEL
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Log para debug (sempre em produção para identificar problemas)
  if (origin) {
    console.log(`[CORS] Requisição de origem: ${origin}`);
    console.log(`[CORS] Método: ${req.method}, Path: ${req.path}`);
  }
  
  // SEMPRE define os headers CORS básicos
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responde imediatamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    // Verifica se a origem é permitida antes de responder ao preflight
    if (isOriginAllowed(origin)) {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      console.log(`[CORS] ✅ Preflight OPTIONS permitido para: ${origin}`);
      return res.status(200).end();
    } else {
      // Origem não permitida - bloqueia preflight
      console.warn(`[CORS] ❌ Preflight OPTIONS bloqueado para: ${origin}`);
      console.warn(`[CORS] Origens permitidas:`, getAllowedOrigins());
      return res.status(403).json({ 
        error: 'CORS policy: Origin not allowed',
        allowedOrigins: getAllowedOrigins()
      });
    }
  }
  
  // Verifica se a origem é permitida para requisições normais (apenas URLs específicas)
  if (isOriginAllowed(origin)) {
    // Se há origin, usa ela; caso contrário, permite qualquer origem (apenas para requisições sem origin)
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      console.log(`[CORS] ✅ Origem permitida: ${origin}`);
    } else {
      // Sem origin, permite qualquer origem mas sem credentials (para ferramentas como Postman)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    // Origem não permitida - bloqueia e loga
    console.warn(`[CORS] ❌ Origem bloqueada: ${origin}`);
    console.warn(`[CORS] Origens permitidas:`, getAllowedOrigins());
    
    // NÃO define Access-Control-Allow-Origin para origens não permitidas
    // Isso fará com que o navegador bloqueie a requisição
    return res.status(403).json({ 
      error: 'CORS policy: Origin not allowed',
      allowedOrigins: getAllowedOrigins()
    });
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

