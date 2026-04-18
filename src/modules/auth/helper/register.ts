import { StatusCodes } from "http-status-codes";

import { _argon2 } from "../../../lib/argon2";
import { db } from "../../../lib/db/orm/client";
import { User } from "../../../lib/db/orm/db-types";
import { AppError } from "../../../common/errors/app-error";
import { generateEmailVerificationCode } from "../../../lib/email-verification";
import { env } from "../../../config/env";
import { DB_Error } from "../../../lib/db/orm/operations/db-error";

/**
 * Checks if the provided email already exists in the database.
 * @param email The email address to check for existence
 * @throws {AppError} If the email already exists, an AppError with status code 409 is thrown
 */
const checkEmailDoesNotExists = async (email: string) => {
    const existingUser = await db.emailAddresses.retrieval.findUnique({
        options: {
            where: {
                email: email,
            },
        },
    });
    if (existingUser) {
        throw new AppError({
            statusCode: StatusCodes.CONFLICT,
            code: "AUTH_EMAIL_EXISTS",
            message: "Email is already in use",
        });
    }
};

interface CreateUserResult {
    user: Partial<User>;
    emailAddress: {
        email: string;
        verification_code: string;
    };
}

/**
 * Creates the necessary database records for a new user, including the user record, email address record, and security record.
 * @param firstName The first name of the user
 * @param lastName The last name of the user
 * @param username The username of the user
 * @param email The email address of the user
 * @param password The plaintext password of the user (will be hashed before storing)
 * @returns A promise that resolves to an object containing the created user and email address information
 * @throws {AppError} If any of the database operations fail, an AppError with status code 500 is thrown
 */
const createRecords = async (
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    password: string
): Promise<CreateUserResult> => {
    try {
        const passwordHash = await _argon2.hash(password);

        const user = await db.users.persist.create({
            data: {
                first_name: firstName,
                last_name: lastName,
                username: username,
            },
        });

        if (!user) {
            throw new AppError({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: "AUTH_USER_CREATION_FAILED",
                message: "Failed to create user",
            });
        }

        const emailAddress = await db.emailAddresses.persist.create({
            data: {
                user_id: user.id,
                email: email,
                is_verified: false,
                verification_code: generateEmailVerificationCode(),
                verification_expires_at: new Date(
                    Date.now() + env.VERIFICATION_CODE_EXPIRATION_MINUTES * 60 * 1000
                ),
                vcode_sent_at: new Date(),
            },
        });

        if (!emailAddress) {
            await db.users.mutation.delete({
                options: {
                    // Rollback user creation
                    where: {
                        id: user.id,
                    },
                },
            });
            throw new AppError({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: "AUTH_USER_CREATION_FAILED",
                message: "Failed to create user email address",
            });
        }

        const security = await db.securities.persist.create({
            data: {
                user_id: user.id,
                password_hash: passwordHash,
            },
        });

        if (!security) {
            await db.users.mutation.delete({
                options: {
                    // Rollback user creation
                    where: {
                        id: user.id,
                    },
                },
            });
            await db.emailAddresses.mutation.delete({
                options: {
                    // Rollback email address creation
                    where: {
                        user_id: user.id,
                    },
                },
            });
            throw new AppError({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: "AUTH_USER_CREATION_FAILED",
                message: "Failed to create user security record",
            });
        }

        return {
            user,
            emailAddress: {
                email: emailAddress.email!,
                verification_code: emailAddress.verification_code!,
            },
        };
    } catch (error) {
        throw error;
    }
};

export { checkEmailDoesNotExists, createRecords };
