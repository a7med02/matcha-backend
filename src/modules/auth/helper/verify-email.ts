import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error";
import { db } from "../../../lib/db/orm/client";
import { env } from "../../../config/env";
import { EmailAddress } from "../../../lib/db/orm/db-types";

const attemptCodeVerification = async (email: string, code: string): Promise<EmailAddress> => {
    // 1. Retrieve the email record from the database
    const emailRecord = await db.emailAddresses.retrieval.findUnique({
        options: {
            where: {
                email: email,
            },
        },
    });
    if (!emailRecord) {
        throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            code: "AUTH_EMAIL_NOT_FOUND",
            message: "Email address not found",
        });
    }

    // 2. Check if the email is locked due to too many failed attempts
    if (
        emailRecord.is_locked === true &&
        emailRecord.lock_expires_at &&
        emailRecord.lock_expires_at.getTime() > Date.now()
    ) {
        throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            code: "AUTH_EMAIL_LOCKED",
            message: "Email is locked due to too many failed verification attempts",
        });
    }

    // 3. Check if the email is already verified
    if (emailRecord.is_verified === true) {
        throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            code: "AUTH_EMAIL_ALREADY_VERIFIED",
            message: "Email is already verified",
        });
    }

    console.log("Email verification code expires at: ", emailRecord.verification_expires_at);
    console.log("Current time: ", new Date());

    // 4. Check if the verification code has expired
    if (
        emailRecord.verification_code === code &&
        emailRecord.verification_expires_at.getTime() <= Date.now()
    ) {
        throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            code: "AUTH_VERIFICATION_CODE_EXPIRED",
            message: "Verification code has expired",
        });
    }

    // 5. Verify the code and update attempts and lock status if necessary
    if (emailRecord.verification_code !== code) {
        // If the code is incorrect and attempts have reached the maximum, lock the email
        if (emailRecord.verification_attempts + 1 >= env.MAX_VERIFICATION_ATTEMPTS) {
            await db.emailAddresses.mutation.update({
                options: {
                    where: {
                        id: emailRecord.id,
                    },
                },
                data: {
                    verification_attempts: 0,
                    last_verification_attempt_at: new Date(),
                    is_locked: true,
                    lock_expires_at: new Date(
                        Date.now() + env.EMAIL_LOCK_DURATION_MINUTES * 60 * 1_000
                    ),
                },
            });
            throw new AppError({
                statusCode: StatusCodes.BAD_REQUEST,
                code: "AUTH_TOO_MANY_VERIFICATION_ATTEMPTS",
                message: "Too many verification attempts",
            });
        }

        // If the code is incorrect but attempts are still allowed, just update the attempts and last attempt time
        const resetVerificationAttempts = emailRecord.last_verification_attempt_at
            ? emailRecord.last_verification_attempt_at.getTime() +
                  env.VERIFICATION_ATTEMPT_RESET_WINDOW_MINUTES * 60 * 1_000 <=
              Date.now()
            : false;

        // If the reset window has passed, reset attempts to 1, otherwise increment
        await db.emailAddresses.mutation.update({
            options: {
                where: {
                    id: emailRecord.id,
                },
            },
            data: {
                verification_attempts: resetVerificationAttempts
                    ? 1
                    : emailRecord.verification_attempts + 1,
                last_verification_attempt_at: new Date(),
            },
        });

        throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            code: "AUTH_INVALID_VERIFICATION_CODE",
            message: "Invalid verification code",
        });
    }

    return emailRecord;
};

const markEmailAsVerified = async (emailRecord: EmailAddress): Promise<void> => {
    await db.emailAddresses.mutation.update({
        options: {
            where: {
                id: emailRecord.id,
            },
        },
        data: {
            is_verified: true,
            verification_attempts: emailRecord.verification_attempts + 1,
        },
    });
};

export { attemptCodeVerification, markEmailAsVerified };
