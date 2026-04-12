import fs from "fs";
import path from "path";
import { logger } from "../../config/logger";
import { getPool, shutdownPool } from "./db";

const SCHEMA_PATH = "../../../db/schema.sql"

const runMigration = async () => {
    const pool = getPool();
    const client = await pool.connect();

    try {
        logger.info("Starting database migration...");

        const schemaPath = path.join(__dirname, SCHEMA_PATH);
        const sql = fs.readFileSync(schemaPath, "utf8");

        await client.query(sql);

        logger.info("Migration completed successfully.");
    } catch (err: any) {
        logger.error("Migration failed!", { message: err.message });
        process.exit(1);
    } finally {
        client.release();
        await shutdownPool();
    }
};

runMigration();
