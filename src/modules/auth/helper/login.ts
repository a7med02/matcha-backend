import { StatusCodes } from "http-status-codes";

import { JWT } from "../../../lib/jwt";
import { CRYPTO } from "../../../lib/crypto";
import { _argon2 } from "../../../lib/argon2";
import { db } from "../../../lib/db/orm/client";
import { AppError } from "../../../common/errors/app-error";
import { AuthTokenPayload, AuthUser, PublicUser } from "../auth.types";

interface QueryResult {
    id: string;
    email: string;
    is_verified: boolean;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        username: string;
    };
    security: {
        id: string;
        password_hash: string;
    };
}

/**
 * Checks if a user with the given email exists and is verified. If the user does not exist or is not verified, an AppError is thrown.
 * @param email The email address to check for existence and verification status
 * @returns A promise that resolves to the user record if it exists and is verified
 * @throws {AppError} If the user does not exist or is not verified, an AppError with appropriate status code and message is thrown
 */
const checkUserExists = async (email: string): Promise<QueryResult> => {
    const result = await db.emailAddresses.retrieval.findUnique({
        options: {
            where: {
                email: email,
            },
            select: ["id", "email", "is_verified"],
        },
        include: {
            user: {
                select: ["id", "first_name", "last_name", "username"],
            },
            security: {
                select: ["id", "password_hash"],
            },
        },
    });

    if (!result) {
        throw new AppError({
            statusCode: StatusCodes.UNAUTHORIZED,
            code: "AUTH_INVALID_CREDENTIALS",
            message: "Account with the provided email does not exist",
        });
    }

    if (!result.is_verified) {
        throw new AppError({
            statusCode: StatusCodes.UNAUTHORIZED,
            code: "AUTH_EMAIL_NOT_VERIFIED",
            message: "Account is not verified",
        });
    }

    return result as QueryResult;
};

/**
 * Verifies the provided plaintext password against the stored password hash.
 * @param password The plaintext password to verify
 * @param result The user record containing the stored password hash to compare against
 * @returns A promise that resolves to true if the password is correct, or throws an AppError if the password is incorrect
 * @throws {AppError} If the password is incorrect, an AppError with status code 401 is thrown
 */
const verifyPassword = async (password: string, result: QueryResult): Promise<boolean> => {
    const passwordMatches = await _argon2.verify(result.security.password_hash, password);

    if (!passwordMatches) {
        throw new AppError({
            statusCode: StatusCodes.UNAUTHORIZED,
            code: "AUTH_INVALID_CREDENTIALS",
            message: "Invalid email or password",
        });
    }
    return true;
};

export type LoginTokens = {
    accessToken: string;
    refreshToken: string;
};

/**
 * Logs in the user by generating JWT tokens and creating a session record in the database.
 * @param user The authenticated user for whom to generate tokens and create a session
 * @returns A promise that resolves to a LoginResult containing the public user data and generated tokens
 * @throws If token generation fails or if there is an error creating the session record, an AppError with status code 500 is thrown
 */
const loginUser = async (userId: string, email: string): Promise<LoginTokens> => {
    const payload: AuthTokenPayload = {
        userId: userId,
        email: email,
    };

    try {
        const tokens = await JWT.generateTokens(userId, payload);

        await db.sessions.persist.create({
            data: {
                user_id: userId,
                session_token: CRYPTO.encrypt(tokens.refreshToken),
                expires_at: new Date(Date.now() + JWT.getRefreshTokenExpiryMs()),
            },
            select: ["id"],
        });

        return tokens;
    } catch (error) {
        throw error;
    }
};

export { checkUserExists, verifyPassword, loginUser };
