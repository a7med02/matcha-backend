import { StatusCodes } from "http-status-codes";

import { authService } from "./auth.service";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import type { LoginInput, RegisterInput } from "./auth.types";

const authController = {
    register: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as RegisterInput;
        const result = await authService.register(payload);
        res.status(StatusCodes.CREATED).json(result);
    },

    login: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as LoginInput;
        const result = await authService.login(payload);
        res.status(StatusCodes.OK).json(result);
    },

    me: async (req: Request, res: Response): Promise<void> => {
        if (!req.auth) {
            throw new AppError({
                statusCode: StatusCodes.UNAUTHORIZED,
                code: "AUTH_UNAUTHORIZED",
                message: "Authentication required",
            });
        }

        const user = await authService.getCurrentUser(req.auth.userId);
        res.status(StatusCodes.OK).json({ user });
    },
};

export { authController };
