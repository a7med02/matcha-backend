import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import { db } from "./db/orm/client";
import { CRYPTO } from "./crypto";

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export class JWT {
    private static readonly privateKey: string = env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
    private static readonly publicKey: string = env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
    private static readonly accessExpiresIn: SignOptions["expiresIn"] =
        env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"];
    private static readonly refreshExpiresIn: SignOptions["expiresIn"] =
        env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"];
    private static readonly refreshExpirationSeconds: number = env.JWT_REFRESH_EXPIRATION_SECONDS;
    private static readonly algorithm: jwt.Algorithm = "RS256";
    private static readonly issuer: string = env.JWT_ISSUER || "http://localhost:3000";
    private static readonly audience: string = env.JWT_AUDIENCE || "http://localhost:5173";

    /**
     * @returns The refresh token expiration time in milliseconds. Defaults to 7 days if not set or invalid.
     */
    public static getRefreshTokenExpiryMs(): number {
        if (typeof this.refreshExpirationSeconds === "number") {
            return this.refreshExpirationSeconds * 1_000;
        }
        // Fallback to default 7 days if not set or invalid
        return 7 * 24 * 60 * 60 * 1_000;
    }

    /**
     * Generates a pair of JWT access and refresh tokens for the given user ID and payload.
     * @param userId The user ID to set as the 'sub' claim in the token
     * @param payload Additional payload to include in the access token (e.g., email, roles)
     * @returns An object containing the generated access token and refresh token
     * @throws AppError with status 500 if token generation fails
     */
    public static async generateTokens(userId: string, payload: object): Promise<AuthTokens> {
        const baseOptions: SignOptions = {
            algorithm: this.algorithm,
            issuer: this.issuer, // Sets the 'iss' claim
            audience: this.audience, // Sets the 'aud' claim
            subject: userId, // Sets the 'sub' claim
        };

        try {
            const accessToken = jwt.sign(payload, this.privateKey, {
                ...baseOptions,
                expiresIn: this.accessExpiresIn,
                jwtid: crypto.randomUUID(), // Sets a unique 'jti' claim
            });

            const refreshToken = jwt.sign({}, this.privateKey, {
                ...baseOptions,
                expiresIn: this.refreshExpiresIn,
                jwtid: crypto.randomUUID(), // Sets a unique 'jti' claim
            });

            // TODO: remove this db call outside of this method and move it to the auth service, this is just a temporary solution to store the refresh token in the database for now, we will implement a proper session management system later
            const result = await db.sessions.persist.create({
                data: {
                    user_id: userId,
                    session_token: CRYPTO.encrypt(refreshToken),
                    expires_at: new Date(Date.now() + this.getRefreshTokenExpiryMs()),
                },
                select: ["id"],
            });

            return { accessToken, refreshToken };
        } catch (error) {
            throw new AppError({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: "JWT_GENERATION_FAILED",
                message: "Failed to generate JWT tokens",
                details: error instanceof Error ? error.message : error,
            });
        }
    }

    /**
     * Verifies the given JWT token and returns the decoded payload if valid.
     * @param token The JWT token to verify
     * @returns The decoded payload if the token is valid, or null if invalid/expired
     * @throws AppError with status 401 if the token is invalid or expired
     */
    public static verifyToken(token: string): string | JwtPayload | null {
        try {
            return jwt.verify(token, this.publicKey, {
                algorithms: [this.algorithm],
                issuer: this.issuer, // Verifies the 'iss' claim
                audience: this.audience, // Verifies the 'aud' claim
            });
        } catch (error) {
            // e.g., TokenExpiredError, JsonWebTokenError (if 'iss'/'aud' mismatch)
            throw new AppError({
                statusCode: StatusCodes.UNAUTHORIZED,
                code: "AUTH_INVALID_TOKEN",
                message: "Invalid or expired token",
                details: error instanceof Error ? error.message : error,
            });
        }
    }

    public static decodeToken(token: string): string | JwtPayload | null {
        try {
            return jwt.decode(token, { complete: false });
        } catch (error) {
            throw new AppError({
                statusCode: StatusCodes.BAD_REQUEST,
                code: "AUTH_DECODE_FAILED",
                message: "Failed to decode token",
                details: error instanceof Error ? error.message : error,
            });
        }
    }
}
