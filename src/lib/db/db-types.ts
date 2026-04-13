import z from "zod";

export const Users = {
    id: "id",
    firstName: "first_name",
    lastName: "last_name",
    username: "username",
    createdAt: "created_at",
    updatedAt: "updated_at",
} as const;

export const EmailAddresses = {
    id: "id",
    userId: "user_id",
    email: "email",
    verified: "verified",
    verificationAttempts: "verification_attempts",
    verificationCode: "verification_code",
    createdAt: "created_at",
    updatedAt: "updated_at",
} as const;

export const Securities = {
    id: "id",
    userId: "user_id",
    passwordHash: "password_hash",
    failedAttempts: "failed_attempts",
    lockedUntil: "locked_until",
    lastFailedAt: "last_failed_at",
    mfaEnabled: "mfa_enabled",
    mfaSecret: "mfa_secret",
    recoveryCodes: "recovery_codes",
    passwordChangedAt: "password_changed_at",
    resetToken: "reset_token",
    resetExpiresAt: "reset_expires_at",
    lastLoginAt: "last_login_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
} as const;

export const UserSchema = z.object({
    id: z.uuid(),
    first_name: z.string().max(50),
    last_name: z.string().max(50),
    username: z.string().max(20),
    created_at: z.date(),
    updated_at: z.date(),
});

export const EmailAddressesSchema = z
    .object({
        id: z.uuid(),
        user_id: z.uuid(),
        email: z.email().max(255),
        verified: z.boolean(),
        verification_code: z.string().length(6),
        verification_attempts: z.number().int().nullable(),
        created_at: z.date(),
        updated_at: z.date(),
    })
    .refine(
        (data) => {
            if (!data.verified && !data.verification_code) return false;
            return true;
        },
        {
            error: "verification_code is required when verified is false",
            path: ["verified"],
        }
    );

export const SecuritiesSchema = z
    .object({
        id: z.uuid(),
        user_id: z.uuid(),
        password_hash: z.string(),
        failed_attempts: z.number().int().nullable(),
        locked_until: z.date(),
        last_failed_at: z.date().nullable(),
        mfa_enabled: z.boolean().nullable(),
        mfa_secret: z.string().nullable(),
        recovery_codes: z.array(z.string().length(8)).max(10).nullable(),
        password_changed_at: z.date(),
        reset_token: z.string().nullable(),
        reset_expires_at: z.date().nullable(),
        last_login_at: z.date(),
        created_at: z.date(),
        updated_at: z.date(),
    })
    .refine(
        (data) => {
            if (data.mfa_enabled && !data.mfa_secret) return false;
            return true;
        },
        {
            message: "mfa_secret is required when mfa_enabled is true",
            path: ["mfa_secret"],
        }
    )
    .refine(
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

export type User = z.infer<typeof UserSchema>;
export type EmailAddress = z.infer<typeof EmailAddresses>;
export type Security = z.infer<typeof SecuritiesSchema>;

export const UpsertUserSchema = UserSchema.omit({ id: true, created_at: true, updated_at: true });
export type UpsertUser = z.infer<typeof UpsertUserSchema>;

export const UpsertEmailAddressSchema = EmailAddressesSchema.omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
});
export type UpsertEmailAddress = z.infer<typeof UpsertEmailAddressSchema>;

export const UpsertSecuritySchema = SecuritiesSchema.omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
});
export type UpsertSecurity = z.infer<typeof UpsertSecuritySchema>;
