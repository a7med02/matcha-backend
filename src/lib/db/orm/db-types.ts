import z from "zod";
import { env } from "../../../config/env";

// -------------- User and related types --------------

export const UsersTableName = "users";
export const Users = {
    id: "id",
    first_name: "first_name",
    last_name: "last_name",
    username: "username",
    created_at: "created_at",
    updated_at: "updated_at",
} as const;

export const UserSchema = z.object({
    id: z.uuid(),
    first_name: z.string().min(env.FIRST_NAME_MIN_LENGTH).max(env.FIRST_NAME_MAX_LENGTH),
    last_name: z.string().min(env.LAST_NAME_MIN_LENGTH).max(env.LAST_NAME_MAX_LENGTH),
    username: z.string().min(env.USERNAME_MIN_LENGTH).max(env.USERNAME_MAX_LENGTH),
    created_at: z.date(),
    updated_at: z.date(),
});

export const UpsertUserSchema = UserSchema.omit({ id: true, created_at: true, updated_at: true });
export type UpsertUser = z.infer<typeof UpsertUserSchema>;

export type User = z.infer<typeof UserSchema>;
export type UserUniqueFields = "id" | "username";

// -------------- EmailAddress and related types --------------

export const EmailAddressesTableName = "email_addresses";
export const EmailAddresses = {
    id: "id",
    user_id: "user_id",
    email: "email",
    verified: "verified",
    verification_attempts: "verification_attempts",
    verification_code: "verification_code",
    created_at: "created_at",
    updated_at: "updated_at",
} as const;

const BaseEmailAddressSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    email: z.email().min(env.EMAIL_MIN_LENGTH).max(env.EMAIL_MAX_LENGTH),
    verified: z.boolean(),
    verification_code: z.string().length(env.VERIFICATION_CODE_LENGTH),
    verification_attempts: z.number().int().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
});

export const EmailAddressesSchema = BaseEmailAddressSchema.refine(
    (data) => {
        if (!data.verified && !data.verification_code) return false;
        return true;
    },
    {
        error: "verification_code is required when verified is false",
        path: ["verified"],
    }
);
export const UpsertEmailAddressSchema = BaseEmailAddressSchema.omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
});
export type UpsertEmailAddress = z.infer<typeof UpsertEmailAddressSchema>;

export type EmailAddress = z.infer<typeof EmailAddressesSchema>;
export type EmailAddressUniqueFields = "id" | "user_id" | "email";

// -------------- Security and related types --------------

export const SecuritiesTableName = "securities";
export const Securities = {
    id: "id",
    user_id: "user_id",
    password_hash: "password_hash",
    failed_attempts: "failed_attempts",
    locked_until: "locked_until",
    last_failed_at: "last_failed_at",
    mfa_enabled: "mfa_enabled",
    mfa_secret: "mfa_secret",
    recovery_codes: "recovery_codes",
    password_changed_at: "password_changed_at",
    reset_token: "reset_token",
    reset_expires_at: "reset_expires_at",
    last_login_at: "last_login_at",
    created_at: "created_at",
    updated_at: "updated_at",
} as const;

export const BaseSecuritiesSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    password_hash: z.string(),
    failed_attempts: z.number().int().nullable(),
    locked_until: z.date(),
    last_failed_at: z.date().nullable(),
    mfa_enabled: z.boolean().nullable(),
    mfa_secret: z.string().nullable(),
    recovery_codes: z
        .array(z.string().length(env.RECOVERY_CODE_LENGTH))
        .max(env.RECOVERY_CODE_MAX_COUNT)
        .nullable(),
    password_changed_at: z.date(),
    reset_token: z.string().nullable(),
    reset_expires_at: z.date().nullable(),
    last_login_at: z.date(),
    created_at: z.date(),
    updated_at: z.date(),
});

export type Security = z.infer<typeof BaseSecuritiesSchema>;
export type SecurityUniqueFields = "id" | "user_id";

export const SecuritiesSchema = BaseSecuritiesSchema.refine(
    (data) => {
        if (data.mfa_enabled && !data.mfa_secret) return false;
        return true;
    },
    {
        message: "mfa_secret is required when mfa_enabled is true",
        path: ["mfa_secret"],
    }
).refine(
    (data) => {
        const hasToken = !!data.reset_token;
        const hasExpiry = !!data.reset_expires_at;
        return hasToken === hasExpiry;
    },
    {
        message: "reset_token and reset_expires_at must both be present or both be null",
        path: ["reset_token"],
    }
);
export const UpsertSecuritySchema = BaseSecuritiesSchema.omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
});
export type UpsertSecurity = z.infer<typeof UpsertSecuritySchema>;
