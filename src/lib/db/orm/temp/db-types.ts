import z from "zod";

// This file is generated from schema.sql.
// Run `npm run generate:orm` after updating the schema.

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

export const BaseUserSchema = z.object({
    id: z.uuid(),
    first_name: z.string().max(50).min(2),
    last_name: z.string().max(50).min(2),
    username: z.string().max(20).min(2),
    created_at: z.date(),
    updated_at: z.date(),
});
export const UserSchema = BaseUserSchema;
export type User = z.infer<typeof UserSchema>;
export const UpsertUserSchema = BaseUserSchema.omit({ id: true, created_at: true, updated_at: true });
export type UpsertUser = z.infer<typeof UpsertUserSchema>;

export type UserUniqueFields = "id" | "username";

// -------------- EmailAddress and related types --------------

export const EmailAddressesTableName = "email_addresses";
export const EmailAddresses = {
    id: "id",
    user_id: "user_id",
    email: "email",
    is_verified: "is_verified",
    verification_token: "verification_token",
    verification_expires_at: "verification_expires_at",
    verification_attempts: "verification_attempts",
    last_verification_attempt_at: "last_verification_attempt_at",
    vcode_sent_at: "vcode_sent_at",
    vcode_resend_count: "vcode_resend_count",
    is_vcode_resend_locked: "is_vcode_resend_locked",
    vcode_resend_lock_expires_at: "vcode_resend_lock_expires_at",
    is_locked: "is_locked",
    lock_expires_at: "lock_expires_at",
    created_at: "created_at",
    updated_at: "updated_at",
} as const;

export const BaseEmailAddressSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    email: z.email().max(254).min(5),
    is_verified: z.boolean(),
    verification_token: z.string(),
    verification_expires_at: z.date(),
    verification_attempts: z.number().int(),
    last_verification_attempt_at: z.date().nullable(),
    vcode_sent_at: z.date().nullable(),
    vcode_resend_count: z.number().int(),
    is_vcode_resend_locked: z.boolean(),
    vcode_resend_lock_expires_at: z.date().nullable(),
    is_locked: z.boolean(),
    lock_expires_at: z.date().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
});
export const EmailAddressSchema = BaseEmailAddressSchema.refine(
    (data) => {
        if (data.is_verified && !data.verification_token) return false;
        return true;
    },
    {
        message: "verification_token is required when is_verified is true",
        path: ["verification_token"],
    }
).refine(
    (data) => {
        if (data.is_locked && !data.lock_expires_at) return false;
        return true;
    },
    {
        message: "lock_expires_at is required when is_locked is true",
        path: ["lock_expires_at"],
    }
);
export type EmailAddress = z.infer<typeof EmailAddressSchema>;
export const UpsertEmailAddressSchema = BaseEmailAddressSchema.omit({ id: true, created_at: true, updated_at: true });
export type UpsertEmailAddress = z.infer<typeof UpsertEmailAddressSchema>;

export type EmailAddressUniqueFields = "id" | "email";

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
    logged_in: "logged_in",
    last_login_at: "last_login_at",
    created_at: "created_at",
    updated_at: "updated_at",
} as const;

export const BaseSecuritySchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    password_hash: z.string(),
    failed_attempts: z.number().int().nullable(),
    locked_until: z.date().nullable(),
    last_failed_at: z.date().nullable(),
    mfa_enabled: z.boolean(),
    mfa_secret: z.string().nullable(),
    recovery_codes: z.array(z.string()).nullable(),
    password_changed_at: z.date(),
    reset_token: z.string().nullable(),
    reset_expires_at: z.date().nullable(),
    logged_in: z.boolean(),
    last_login_at: z.date().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
});
export const SecuritySchema = BaseSecuritySchema.refine(
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
        const hasField1 = !!data.reset_expires_at;
        const hasField2 = !!data.reset_token;
        return hasField1 === hasField2;
    },
    {
        message: "reset_expires_at and reset_token must both be present or both be null",
        path: ["reset_expires_at"],
    }
);
export type Security = z.infer<typeof SecuritySchema>;
export const UpsertSecuritySchema = BaseSecuritySchema.omit({ id: true, created_at: true, updated_at: true });
export type UpsertSecurity = z.infer<typeof UpsertSecuritySchema>;

export type SecurityUniqueFields = "id" | "reset_token";

// -------------- Session and related types --------------

export const SessionsTableName = "sessions";
export const Sessions = {
    id: "id",
    user_id: "user_id",
    session_token: "session_token",
    expires_at: "expires_at",
    created_at: "created_at",
    updated_at: "updated_at",
} as const;

export const BaseSessionSchema = z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    session_token: z.string(),
    expires_at: z.date(),
    created_at: z.date(),
    updated_at: z.date(),
});
export const SessionSchema = BaseSessionSchema;
export type Session = z.infer<typeof SessionSchema>;
export const UpsertSessionSchema = BaseSessionSchema.omit({ id: true, created_at: true, updated_at: true });
export type UpsertSession = z.infer<typeof UpsertSessionSchema>;

export type SessionUniqueFields = "id";
export type SessionCompositeUniqueFields = ["user_id", "session_token"];

// -------------- Other functions --------------
export const getTableFields = (tableName: string) => {
    switch (tableName) {
        case UsersTableName:
            return Users;
        case EmailAddressesTableName:
            return EmailAddresses;
        case SecuritiesTableName:
            return Securities;
        case SessionsTableName:
            return Sessions;
        default:
            throw new Error(`Unknown table name: ${tableName}`);
    }
};

// -------------- End of types --------------