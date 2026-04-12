import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default("/api"),
    JWT_SECRET: z.string().min(32).default("dev_only_replace_with_secure_secret_123456"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    // Postgres Database variables
    DATABASE_URL: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const issues = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
        .join("; ");

    throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = parsed.data;
