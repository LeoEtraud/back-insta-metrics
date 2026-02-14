import { app, httpServer } from "./app";
import { registerRoutes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

// FUNÇÃO DE LOGGING - FORMATA E EXIBE MENSAGENS DE LOG COM TIMESTAMP
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Initialize routes and start server
(async () => {
  try {
    await registerRoutes(httpServer, app);

    // Error handler must be last
    app.use(errorHandler);

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`Server running on port ${port}`);
        log(`Environment: ${process.env.NODE_ENV || "development"}`);
      },
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

