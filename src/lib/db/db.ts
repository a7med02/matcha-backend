import pg from "pg";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

const { Pool } = pg;

let pool: pg.Pool;

export const getPool = () => {
    if (!pool) {
        logger.info("Creating a new database pool...");
        pool = new Pool({
            connectionString: env.DATABASE_URL,
        });

        pool.on("error", (err) => {
            logger.error("Inexpected error on idle client", { err });
        });
    }

    return pool;
}

