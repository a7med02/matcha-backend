import { SignOptions } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import { _argon2 } from "../../../lib/argon2";
import { db } from "../../../lib/db/orm/client";
import { AppError } from "../../../common/errors/app-error";
import { AuthResult, AuthTokenPayload, AuthUser, PublicUser } from "../auth.types";
import { env } from "../../../config/env";

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

const toPublicUser = (user: AuthUser): PublicUser => {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
    };
};

const loginUser = (user: AuthUser): AuthResult => {
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
};
