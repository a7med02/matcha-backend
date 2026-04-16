import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default("/api"),
    JWT_SECRET: z.string().min(32).default("dev_only_replace_with_secure_secret_123456"),
    JWT_EXPIRES_IN: z.string().default("15m"),

    // For Argon2
    ARGON2_MAX_PARALLELISM: z.coerce.number().int().min(1).default(4),
    ARGON2_MAX_MEMORY_COST: z.coerce.number().int().min(10000).default(65536), // 64 MB
    ARGON2_MAX_TIME_COST: z.coerce.number().int().min(1).default(3),

    // For Input Validation
    FIRST_NAME_MIN_LENGTH: z.coerce.number().int().min(1).default(2),
    FIRST_NAME_MAX_LENGTH: z.coerce.number().int().min(1).default(50),
    LAST_NAME_MIN_LENGTH: z.coerce.number().int().min(1).default(2),
    LAST_NAME_MAX_LENGTH: z.coerce.number().int().min(1).default(50),
    USERNAME_MIN_LENGTH: z.coerce.number().int().min(1).default(2),
    USERNAME_MAX_LENGTH: z.coerce.number().int().min(1).default(20),
    PASSWORD_MIN_LENGTH: z.coerce.number().int().min(1).default(8),
    PASSWORD_MAX_LENGTH: z.coerce.number().int().min(1).default(72),
    EMAIL_MIN_LENGTH: z.coerce.number().int().min(1).default(5),
    EMAIL_MAX_LENGTH: z.coerce.number().int().min(1).default(254),

    RECOVERY_CODE_LENGTH: z.coerce.number().int().min(1).default(8),
    RECOVERY_CODE_MAX_COUNT: z.coerce.number().int().min(1).default(10),
    VERIFICATION_CODE_LENGTH: z.coerce.number().int().min(1).default(6),
    MAX_VERIFICATION_ATTEMPTS: z.coerce.number().int().min(1).default(3),

    // Postgres Database variables
    MAX_DB_POOL_SIZE: z.coerce.number().int().min(1).default(20),
    IDLE_TIMEOUT_MILLIS: z.coerce.number().int().min(0).default(60_000),
    CONNECTION_TIMEOUT_MILLIS: z.coerce.number().int().min(0).default(2_000),

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
