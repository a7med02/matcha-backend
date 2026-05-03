import { StatusCodes } from "http-status-codes";

import type {
    AuthTokenPayload,
    AuthUser,
    AuthVerifyEmailResult,
    LoginInput,
    ResendVerificationResult,
} from "./auth.types";
import { logger } from "../../config/logger";
import { AppError } from "../../common/errors/app-error";
import { checkEmailDoesNotExists, createRecords } from "./helper/register";
import {
    jwksJSONInput,
    RegisterInput,
    ResendVerificationInput,
    VerifyEmailInput,
} from "./auth.validation";
import { attemptCodeVerification, markEmailAsVerified } from "./helper/verify-email";
import { resendVerificationCode } from "./helper/resend-code";
import { checkUserExists, LoginTokens, loginUser, verifyPassword } from "./helper/login";
import { env } from "../../config/env";
import { JWT } from "../../lib/jwt";
import { isSessionValid } from "./helper/refresh";
import { getPublicKey } from "./helper/jwks-json";

class AuthService {
    public async jwksJSON(input: jwksJSONInput): Promise<string> {
        try {
            if (input.clientSecret === env.JWT_CLIENT_ACCESS_TO_PUBLIC_KEY_SECRET) {
                return await getPublicKey();
            }
            throw new AppError({
                statusCode: StatusCodes.UNAUTHORIZED,
                code: "PUBLIC_KEY_RETRIEVAL_UNAUTHORIZED",
                message: "Invalid client secret",
            });
        } catch (error) {
            logger.debug("Error retrieving public key", { error });
            logger.error("Failed to retrieve public key:", {
                message: error instanceof Error ? error.message : "Unknown error",
            });
            throw new AppError({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: "PUBLIC_KEY_RETRIEVAL_FAILED",
                message: "Failed to retrive public key.",
            });
        }
    }

    /**
     * Registers a new user. Validates input, checks for existing email, hashes password, and creates the user record.
     * @param input Registration data including first name, last name, username, email, and password
     * @returns An AuthResult containing the public user data and access token
     */
    public async register(input: RegisterInput): Promise<AuthUser> {
        try {
            // Check if email already exists
            //* if the email already exists, an AppError will be thrown with status code 409
            await checkEmailDoesNotExists(input.email);

            // TODO: Send verification email here (out of scope for now)
            // for now we will just log the verification code to the console for testing purposes

            const result = await createRecords(
                input.firstName,
                input.lastName,
                input.username,
                input.email,
                input.password
            );

            logger.info(
                `User registered with email ${input.email}.
                Verification code: ${result.emailAddress.verification_code}`
            );

            return {
                id: result.user.id!,
                firstName: result.user.first_name!,
                lastName: result.user.last_name!,
                username: result.user.username!,
                email: result.emailAddress.email!,
                createdAt: result.user.created_at!,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.debug("Error creating user:", { error });
            logger.error("User registration failed for email:", {
                email: input.email,
                message: error instanceof Error ? error.message : "Unknown error",
            });
            throw new AppError({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: "AUTH_USER_CREATION_FAILED",
                message: "Failed to create user",
            });
        }
    }

    public async verifyEmail(input: VerifyEmailInput): Promise<AuthVerifyEmailResult> {
        try {
            const emailRecord = await attemptCodeVerification(input.email, input.verificationCode);

            await markEmailAsVerified(emailRecord);

            return {
                message: "Email verified successfully",
            };
        } catch (error) {
            logger.debug("Email verification failed:", { error });
            logger.error("Email verification failed for email:", {
                email: input.email,
                message: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    public async resendVerification(
        input: ResendVerificationInput
    ): Promise<ResendVerificationResult> {
        try {
            await resendVerificationCode(input.email);
            return {
                message: "Verification code resent successfully",
            };
        } catch (error) {
            logger.debug("Resend verification failed:", { error });
            logger.error("Resend verification failed for email:", {
                email: input.email,
                message: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    public async login(input: LoginInput): Promise<{ message: string; tokens: LoginTokens }> {
        try {
            const result = await checkUserExists(input.email);

            await verifyPassword(input.password, result);

            if (result.security.logged_in === true) {
                logger.debug(`Login attempt for already logged in user: ${input.email}`);
                throw new AppError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    code: "AUTH_ALREADY_LOGGED_IN",
                    message: "User is already logged in.",
                });
            }

            const loginTokens = await loginUser(result.user.id, result.email);

            return {
                message: "Login successful",
                tokens: loginTokens,
            };
        } catch (error) {
            logger.debug("Login failed:", { error });
            logger.error("Login failed for email:", {
                email: input.email,
                message: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    public async refreshSession(cookies: {
        [key: string]: string;
    }): Promise<{ message: string; newSessiontoken: string }> {
        try {
            const clientToken: string = cookies[env.JWT_CLIENT_COOKIE_NAME];
            const isValid = await isSessionValid(clientToken);
            if (!isValid) {
                throw new AppError({
                    statusCode: StatusCodes.UNAUTHORIZED,
                    code: "AUTH_TOKEN_REFRESH_FAILED",
                    message: "Refresh token is invalid or expired",
                });
            }

            const clientDecoded = JWT.decode(clientToken) as AuthTokenPayload;
            const newSessiontoken = JWT.refreshSession(clientDecoded.userId, {
                userId: clientDecoded.userId,
                email: clientDecoded.email,
            });

            return {
                message: "Session refreshed",
                newSessiontoken,
            };
        } catch (error) {
            logger.debug("Token refresh failed:", { error });
            logger.error("Token refresh failed:", {
                message: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    public verifySession(cookie: string): boolean {
        try {
            if (!cookie) {
                throw new AppError({
                    statusCode: StatusCodes.UNAUTHORIZED,
                    code: "AUTH_SESSION_INVALID",
                    message: `Token not provided`,
                });
            }

            // Verify both access and refresh tokens
            JWT.verifyToken(cookie);

            return true;
        } catch (error) {
            logger.debug("Session verification failed:", { error });
            logger.error("Session verification failed:", {
                message: error instanceof Error ? error.message : "Unknown error",
            });
            return false;
        }
    }

    // public async getCurrentUser(userId: string): Promise<PublicUser> {
    //                 userId: result.user.id,
    //             }),
    //         };
    //     } catch (error) {
    //         logger.debug("Login failed:", { error });
    //         throw error;
    //     }
    // }

    // public async getCurrentUser(userId: string): Promise<PublicUser> {
    //     const user = await this.repository.findById(userId);

    //     if (!user) {
    //         throw new AppError({
    //             statusCode: 404,
    //             code: "AUTH_USER_NOT_FOUND",
    //             message: "User not found",
    //         });
    //     }

    //     return this.toPublicUser(user);
    // }
}

const authService = new AuthService();

export { authService };
