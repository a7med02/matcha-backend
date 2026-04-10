import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { authService } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.types";

const authController = {
    register: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as RegisterInput;
        const result = await authService.register(payload);
        res.status(201).json(result);
    },

    login: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as LoginInput;
        const result = await authService.login(payload);
        res.status(200).json(result);
    },

    me: async (req: Request, res: Response): Promise<void> => {
        if (!req.auth) {
            throw new AppError({
                statusCode: 401,
                code: "AUTH_UNAUTHORIZED",
                message: "Authentication required",
            });
        }

        const user = await authService.getCurrentUser(req.auth.userId);
        res.status(200).json({ user });
    },
};

export { authController };
