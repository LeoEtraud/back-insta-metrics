// ENTRY POINT PARA VERCEL SERVERLESS FUNCTIONS - EXPORTA APP EXPRESS COMO HANDLER
import { app } from "../src/app";
import { registerRoutes } from "../src/routes";
import { errorHandler } from "../src/middlewares/errorHandler";

// REGISTRA ROTAS E EXPORTA HANDLER PARA VERCEL
let routesInitialized = false;

const initializeRoutes = async () => {
  if (routesInitialized) return;
  
  try {
    await registerRoutes(null, app);
    app.use(errorHandler);
    routesInitialized = true;
  } catch (error) {
    console.error("Failed to initialize routes:", error);
    throw error;
  }
};

// EXPORTA HANDLER SERVERLESS PARA VERCEL
export default async (req: any, res: any) => {
  await initializeRoutes();
  return app(req, res);
};

