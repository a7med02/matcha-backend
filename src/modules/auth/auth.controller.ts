import { StatusCodes } from "http-status-codes";

import { authService } from "./auth.service";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { LoginInput, RegisterInput, VerifyEmailInput } from "./auth.validation";
import { DB_Error } from "../../lib/db/orm/operations/db-error";

const authController = {
    register: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as RegisterInput;
        try {
            const result = await authService.register(payload);
            res.status(StatusCodes.CREATED).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    code: "AUTH_REGISTRATION_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    code: "AUTH_REGISTRATION_FAILED",
                    message: "An unexpected error occurred during registration",
                });
            }
            return;
        }
    },

    verifyEmail: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as VerifyEmailInput;
        try {
            const result = await authService.verifyEmail(payload);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    code: "AUTH_EMAIL_VERIFICATION_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    code: "AUTH_EMAIL_VERIFICATION_FAILED",
                    message: "An unexpected error occurred during email verification",
                });
            }
            return;
        }
    },

    resendVerification: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as VerifyEmailInput;
        try {
            const result = await authService.resendVerification(payload);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    code: "AUTH_RESEND_VERIFICATION_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    code: "AUTH_RESEND_VERIFICATION_FAILED",
                    message: "An unexpected error occurred while resending verification email",
                });
            }
            return;
        }
    },

    login: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as LoginInput;
        try {
            const result = await authService.login(payload);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    code: "AUTH_LOGIN_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    code: "AUTH_LOGIN_FAILED",
                    message: "An unexpected error occurred during login",
                });
            }
            return;
        }
    },

    // me: async (req: Request, res: Response): Promise<void> => {
    //     if (!req.auth) {
    //         throw new AppError({
    //             statusCode: StatusCodes.UNAUTHORIZED,
    //             code: "AUTH_UNAUTHORIZED",
    //             message: "Authentication required",
    //         });
    //     }

    //     const user = await authService.getCurrentUser(req.auth.userId);
    //     res.status(StatusCodes.OK).json({ user });
    // },
};

export { authController };
