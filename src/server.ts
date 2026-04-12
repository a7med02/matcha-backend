import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { getPool, shutdownPool } from "./lib/db/db";

getPool();

const server = app.listen(env.PORT, () => {
    logger.info("HTTP server started", {
        env: env.NODE_ENV,
        port: env.PORT,
    });
});

const shutdown = (signal: string): void => {
    logger.info("Shutdown signal received", { signal });

    shutdownPool();

    server.close(() => {
        logger.info("HTTP server stopped");
        process.exit(0);
    });

    setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10_000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
