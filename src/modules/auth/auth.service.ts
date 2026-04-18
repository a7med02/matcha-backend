import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import type { SignOptions } from "jsonwebtoken";

import type {
    AuthResult,
    AuthTokenPayload,
    AuthUser,
    AuthVerifyEmailResult,
    LoginInput,
    PublicUser,
    ResendVerificationResult,
} from "./auth.types";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "../../common/errors/app-error";
import { checkEmailDoesNotExists, createRecords } from "./helper/register";
import { RegisterInput, ResendVerificationInput, VerifyEmailInput } from "./auth.validation";
import { attemptCodeVerification, markEmailAsVerified } from "./helper/verify-email";
import { resendVerificationCode } from "./helper/resend-code";

class AuthService {
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
            logger.error("Error creating user:", { error });
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
            logger.error("Email verification failed:", { error });
            throw error; // Re-throw the error to be handled by the controller
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
            logger.error("Resend verification failed:", { error });
            throw error; // Re-throw the error to be handled by the controller
        }
    }

    public async login(input: LoginInput): Promise<AuthResult> {
        const user = await db.emailAddresses.retrieval.findUnique({
            where: {
                email: input.email,
            },
            include: {
                user: true,
                security: {},
            },
        });

        if (!user) {
            throw new AppError({
                statusCode: 401,
                code: "AUTH_INVALID_CREDENTIALS",
                message: "Invalid email or password",
            });
        }

        const passwordMatches = await _argon2.verify(security?.password_hash!, input.password);

        if (!passwordMatches) {
            throw new AppError({
                statusCode: 401,
                code: "AUTH_INVALID_CREDENTIALS",
                message: "Invalid email or password",
            });
        }

        return this.toAuthResult(user);
    }

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
