import { StatusCodes } from "http-status-codes";

import { authService } from "./auth.service";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import {
    ChangePasswordInput,
    jwksJSONInput,
    LoginInput,
    RegisterInput,
    ResetPasswordRequestInput,
    ResetPasswordVerifyInput,
    VerifyEmailInput,
} from "./auth.validation";
import { DB_Error } from "../../lib/db/orm/operations/db-error";
import { AuthCookie } from "../../lib/cookie";
import { env } from "../../config/env";

const authController = {
    jwksJSON: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as jwksJSONInput;
        try {
            const result = await authService.jwksJSON(payload);
            res.status(StatusCodes.OK).json({
                status: "success",
                publicKey: result,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "PUBLIC_KEY_RETRIEVAL_FAILED",
                    message: "An unexpected error occurred during retrieval.",
                });
            }
        }
    },

    register: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as RegisterInput;
        try {
            const result = await authService.register(payload);
            res.status(StatusCodes.CREATED).json({
                status: "success",
                ...result,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: "AUTH_REGISTRATION_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_REGISTRATION_FAILED",
                    message: "An unexpected error occurred during registration",
                });
            }
        }
    },

    verifyEmail: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as VerifyEmailInput;
        try {
            const result = await authService.verifyEmail(payload);
            res.status(StatusCodes.OK).json({
                status: "success",
                ...result,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: "AUTH_EMAIL_VERIFICATION_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_EMAIL_VERIFICATION_FAILED",
                    message: "An unexpected error occurred during email verification",
                });
            }
        }
    },

    resendVerification: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as VerifyEmailInput;
        try {
            const result = await authService.resendVerification(payload);
            res.status(StatusCodes.OK).json({
                status: "success",
                ...result,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: "AUTH_RESEND_VERIFICATION_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_RESEND_VERIFICATION_FAILED",
                    message: "An unexpected error occurred while resending verification email",
                });
            }
        }
    },

    login: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as LoginInput;
        try {
            const result = await authService.login(payload);
            AuthCookie.setAuthCookies(res, result.tokens);
            res.status(StatusCodes.OK).json({
                status: "success",
                message: result.message,
            });
        } catch (error) {
            if (error instanceof AppError) {
                // Handle already logged in case
                if (error.code === "AUTH_ALREADY_LOGGED_IN") {
                    return void res.redirect(StatusCodes.SEE_OTHER, "/");
                }
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: "AUTH_LOGIN_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_LOGIN_FAILED",
                    message: "An unexpected error occurred during login",
                });
            }
        }
    },

    refreshSession: async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await authService.refreshSession(req.cookies);
            AuthCookie.setSesstionCookie(res, result.newSessiontoken);
            res.status(StatusCodes.OK).json({
                status: "success",
                message: result.message,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_TOKEN_REFRESH_FAILED",
                    message: "An unexpected error occurred during token refresh",
                });
            }
        }
    },

    verifySession: (req: Request, res: Response): void => {
        try {
            const isValid = authService.verifySession(req.cookies[env.JWT_SESSION_COOKIE_NAME]);
            if (isValid) {
                res.status(StatusCodes.OK).json({
                    status: "success",
                });
            } else {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    status: "error",
                    code: "AUTH_INVALID_SESSION",
                    message: "Invalid or expired session",
                });
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: "error",
                code: "AUTH_SESSION_VERIFICATION_FAILED",
                message: "An unexpected error occurred during session verification",
            });
        }
    },

    requestPasswordReset: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as ResetPasswordRequestInput;
        try {
            const result = await authService.requestPasswordReset(payload);
            res.status(StatusCodes.OK).json({
                status: "success",
                resetUrl: result.resetUrl,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: "AUTH_PASSWORD_RESET_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_PASSWORD_RESET_FAILED",
                    message: "An unexpected error occurred during password reset",
                });
            }
        }
    },

    verifyPasswordReset: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as ResetPasswordVerifyInput;
        try {
            const result = await authService.verifyPasswordReset(payload);
            res.status(StatusCodes.OK).json({
                status: "success",
                message: result.message,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: "AUTH_PASSWORD_RESET_VERIFY_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_PASSWORD_RESET_VERIFY_FAILED",
                    message: "An unexpected error occurred during password reset verification",
                });
            }
        }
    },

    changePassword: async (req: Request, res: Response): Promise<void> => {
        const payload = req.body as ChangePasswordInput;
        try {
            const result = await authService.changePassword(payload);
            res.status(StatusCodes.OK).json({
                status: "success",
                message: result.message,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });
            } else if (error instanceof DB_Error) {
                res.status(error.statusCode).json({
                    status: "error",
                    code: "AUTH_PASSWORD_CHANGE_FAILED",
                    message: error.message,
                    details: error.details,
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    code: "AUTH_PASSWORD_CHANGE_FAILED",
                    message: "An unexpected error occurred during password change",
                });
            }
        }
    },
};

export { authController };
