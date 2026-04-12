import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { getPool } from "./lib/db/db";

const pool = getPool();

const server = app.listen(env.PORT, () => {
    logger.info("HTTP server started", {
        env: env.NODE_ENV,
        port: env.PORT,
    });
});

const shutdown = async (signal: string): Promise<void> => {
    logger.info("Shutdown signal received", { signal });

    try {
        await pool.end();
        logger.info("Database pool closed");

        server.close(() => {
            logger.info("HTTP server stopped");
            
            setTimeout(() => {
                process.exit(0);
            }, 100); 
        });
    } catch (err: any) {
        logger.error("Error during shutdown", { err });
        process.exit(1);
    }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
