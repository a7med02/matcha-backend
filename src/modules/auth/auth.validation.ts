import { z } from "zod";

const COMMON_WORDS = ["password", "123456", "qwerty", "letmein", "welcome", "admin", "user" ]

const passwordSchema = z.string().min(8,
    { message: "Password must be at least 8 characters long" })
    .refine((val) => /[A-Z]/.test(val), {
        message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[a-z]/.test(val), {
        message: "Password must contain at least one lowercase letter",
    })
    .refine((val) => /\d/.test(val), {
        message: "Password must contain at least one number",
    })
    .refine((val) => /[^A-Za-z0-9]/.test(val), {
        message: "Password must contain at least one special character",
    })
    .refine((val) => !COMMON_WORDS.some((word) => val.toLowerCase().includes(word)), {
    message: "Password contains a common word that is not allowed",
})

const registerSchema = z.object({
    firstname: z.string().trim().min(2, { message: "Firstname must be at least 2 characters long" })
    .regex(/^[a-zA-Z]+$/, { message: "Firstname must contain only letters" }),

    lastname: z.string().trim().min(2, { message: "Lastname must be at least 2 characters long" })
    .regex(/^[a-zA-Z]+$/, { message: "Lastname must contain only letters" }),
    
    username: z.string().trim().min(2, { message: "Username must be at least 2 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username must contain only letters, numbers, and underscores" }),
    
    email: z.string().email({ message: "Please provide a valid email address" }),
    password: passwordSchema,
});

const loginSchema = z.object({
    email: z.string().email({ message: "Please provide a valid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
});

export { registerSchema, loginSchema };
