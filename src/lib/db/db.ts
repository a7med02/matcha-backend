import pg from "pg";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

const { Pool } = pg;

let pool: pg.Pool;

let isConnecting = false;

export const getPool = (): pg.Pool => {
    if (pool) {
        return pool;
    }

    if (isConnecting) {
        throw new Error("Database pool is currently initializing.");
    }

    try {
        isConnecting = true;
        logger.info("Initializing database pool...");

        if (!env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not defined in environment variables.");
        }

        pool = new Pool({
            connectionString: env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 60_000,
            connectionTimeoutMillis: 2_000,
        });

        pool.on("error", (err) => {
            logger.error("Unexpected error on idle database client", {
                message: err.message,
                stack: err.stack,
            });
        });

        return pool;
    } catch (err: any) {
        logger.error("Failed to create database pool", { err });
        throw err;
    } finally {
        isConnecting = false;
    }
};

export const shutdownPool = async () => {
    if (pool) {
        logger.info("Shutting down database pool...");

        try {
            await pool.end();

            logger.info("Database pool has been shut down successfully.");
        } catch (err: any) {
            logger.error("Failed to shutdown database pool", { err });
        } finally {
            pool = null as any;
        }
    } else {
        logger.warn("Shutdown called, but no active pool was found.");
    }
};
