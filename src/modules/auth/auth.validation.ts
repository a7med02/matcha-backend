import { z } from "zod";

import { env } from "../../config/env";

const jwksJSONSchema = z.object({
    clientSecret: z.string(),
});

type jwksJSONInput = z.infer<typeof jwksJSONSchema>;

const registerSchema = z.object({
    firstName: z
        .string()
        .min(env.FIRST_NAME_MIN_LENGTH, `Min ${env.FIRST_NAME_MIN_LENGTH} characters`)
        .max(env.FIRST_NAME_MAX_LENGTH, `Max ${env.FIRST_NAME_MAX_LENGTH} characters`)
        .regex(/^[a-zA-Z]+$/, "First name can only contain letters"),
    lastName: z
        .string()
        .min(env.LAST_NAME_MIN_LENGTH, `Min ${env.LAST_NAME_MIN_LENGTH} characters`)
        .max(env.LAST_NAME_MAX_LENGTH, `Max ${env.LAST_NAME_MAX_LENGTH} characters`)
        .regex(/^[a-zA-Z]+$/, "Last name can only contain letters"),
    username: z
        .string()
        .min(env.USERNAME_MIN_LENGTH, `Min ${env.USERNAME_MIN_LENGTH} characters`)
        .max(env.USERNAME_MAX_LENGTH, `Max ${env.USERNAME_MAX_LENGTH} characters`)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z
        .email("Invalid email address")
        .min(env.EMAIL_MIN_LENGTH, "Email too short")
        .max(env.EMAIL_MAX_LENGTH, "Email too long"),
    password: z
        .string()
        .min(env.PASSWORD_MIN_LENGTH, `At least ${env.PASSWORD_MIN_LENGTH} characters`)
        .max(env.PASSWORD_MAX_LENGTH, `Max ${env.PASSWORD_MAX_LENGTH} characters`)
        .regex(/[A-Z]/, "Must contain one uppercase letter")
        .regex(/[a-z]/, "Must contain one lowercase letter")
        .regex(/[0-9]/, "Must contain one number")
        .regex(/[!@#$%^&*(),.?":{}|[\]|<>]/, "Must contain one special character"),
});

type RegisterInput = z.infer<typeof registerSchema>;

const verifyEmailSchema = z.object({
    email: z
        .email("Invalid email address")
        .min(env.EMAIL_MIN_LENGTH, "Email too short")
        .max(env.EMAIL_MAX_LENGTH, "Email too long"),
    verificationCode: z.string().regex(/^\d{6}$/, "Verification code must be a 6-digit number"),
});

type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

const resendVerificationSchema = z.object({
    email: z
        .email("Invalid email address")
        .min(env.EMAIL_MIN_LENGTH, "Email too short")
        .max(env.EMAIL_MAX_LENGTH, "Email too long"),
});

type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

const loginSchema = z.object({
    email: z.email().min(env.EMAIL_MIN_LENGTH).max(env.EMAIL_MAX_LENGTH),
    password: z.string().min(env.PASSWORD_MIN_LENGTH).max(env.PASSWORD_MAX_LENGTH),
});

type LoginInput = z.infer<typeof loginSchema>;

export type { RegisterInput, VerifyEmailInput, ResendVerificationInput, LoginInput, jwksJSONInput };
export { registerSchema, verifyEmailSchema, resendVerificationSchema, loginSchema, jwksJSONSchema };
