import z from "zod";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import type { SignOptions } from "jsonwebtoken";

import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { authRepository, type AuthRepository } from "./auth.repository";
import type {
    AuthResult,
    AuthTokenPayload,
    AuthUser,
    LoginInput,
    PublicUser,
    RegisterInput,
} from "./auth.types";
import { _argon2 } from "../../lib/argon2";
import { logger } from "../../config/logger";
import { db } from "../../lib/db/orm/client";
import { registerSchema } from "./auth.validation";
import { generateEmailVerificationCode } from "../../lib/email-verification";

class AuthService {
    constructor(private readonly repository: AuthRepository) {}

    private toPublicUser(user: AuthUser): PublicUser {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
        };
    }

    private toAuthResult(user: AuthUser): AuthResult {
        const payload: AuthTokenPayload = {
            userId: user.id,
            email: user.email,
        };

        const signOptions: SignOptions = {
            expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, signOptions);

        return {
            user: this.toPublicUser(user),
            accessToken,
            tokenType: "Bearer",
            expiresIn: env.JWT_EXPIRES_IN,
        };
    }

    /**
     * Registers a new user. Validates input, checks for existing email, hashes password, and creates the user record.
     * @param input Registration data including first name, last name, username, email, and password
     * @returns An AuthResult containing the public user data and access token
     */
    public async register(input: RegisterInput): Promise<AuthResult> {
        // 1. Validate input
        const inputValidation = registerSchema.safeParse(input);
        if (!inputValidation.success) {
            const validationErrors = z.treeifyError(inputValidation.error);

            throw new AppError({
                statusCode: StatusCodes.BAD_REQUEST,
                code: "AUTH_VALIDATION_ERROR",
                message: "Invalid registration data",
                details: validationErrors,
            });
        }

        // 2. Check if email already exists
        const existingUser = await db.emailAddresses.retrieval.findUnique({
            where: {
                email: input.email,
            },
        });
        if (existingUser) {
            throw new AppError({
                statusCode: StatusCodes.CONFLICT,
                code: "AUTH_EMAIL_EXISTS",
                message: "Email is already in use",
            });
        }

        // 3. Hash password and create user
        const passwordHash = await _argon2.hash(input.password);

        try {
            const user = await db.users.persist.create({
                first_name: input.firstName,
                last_name: input.lastName,
                username: input.username,
            });

            if (!user) {
                throw new AppError({
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                    code: "AUTH_USER_CREATION_FAILED",
                    message: "Failed to create user",
                });
            }

            const emailAddress = await db.emailAddresses.persist.create({
                user_id: user.id,
                email: input.email,
                verified: false,
                verification_code: generateEmailVerificationCode(),
            });

            if (!emailAddress) {
                await db.users.mutation.delete({
                    // Rollback user creation
                    where: {
                        id: user.id,
                    },
                });
                throw new AppError({
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                    code: "AUTH_USER_CREATION_FAILED",
                    message: "Failed to create user email address",
                });
            }

            const security = await db.securities.persist.create({
                user_id: user.id,
                password_hash: passwordHash,
            });

            if (!security) {
                await db.users.mutation.delete({
                    // Rollback user creation
                    where: {
                        id: user.id,
                    },
                });
                await db.emailAddresses.mutation.delete({
                    // Rollback email address creation
                    where: {
                        user_id: user.id,
                    },
                });
                throw new AppError({
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                    code: "AUTH_USER_CREATION_FAILED",
                    message: "Failed to create user security record",
                });
            }

            // TODO: Send verification email here (out of scope for now)
            // for now we will just log the verification code to the console for testing purposes

            logger.info(
                `User registered with email ${input.email}. Verification code: ${emailAddress.verification_code}`
            );

            return this.toAuthResult({
                id: user.id!,
                firstName: user.first_name!,
                lastName: user.last_name!,
                username: user.username!,
                email: emailAddress.email!,
                createdAt: user.created_at!,
            });
        } catch (error) {
            console.error("Error creating user:", error);
            throw new AppError({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: "AUTH_USER_CREATION_FAILED",
                message: "Failed to create user",
            });
        }
    }

    public async login(input: LoginInput): Promise<AuthResult> {
        // const user = await this.repository.findByEmail(input.email);
        const user = await db.emailAddresses.retrieval.findUnique({
            where: {
                email: input.email,
            },
            // include: {
            //     user: true,
            //     security: true,
            // },
        });

        const security = await db.securities.retrieval.findUnique({
            where: {
                user_id: user?.user_id!,
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

    public async getCurrentUser(userId: string): Promise<PublicUser> {
        const user = await this.repository.findById(userId);

        if (!user) {
            throw new AppError({
                statusCode: 404,
                code: "AUTH_USER_NOT_FOUND",
                message: "User not found",
            });
        }

        return this.toPublicUser(user);
    }
}

const authService = new AuthService(authRepository);

export { authService };
