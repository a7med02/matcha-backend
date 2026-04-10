import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().trim().min(2).max(80),
    password: z.string().min(8).max(72),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
});

export { registerSchema, loginSchema };
