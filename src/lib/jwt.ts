import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import { db } from "./db/orm/client";

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export class JWT {
    private privateKey: string;
    private publicKey: string;
    private accessExpiresIn: SignOptions["expiresIn"];
    private refreshExpiresIn: SignOptions["expiresIn"];
    private algorithm: jwt.Algorithm;
    private issuer: string;
    private audience: string;

    constructor() {
        // 1. Ensure newlines are parsed correctly from the .env string
        this.privateKey = env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
        this.publicKey = env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
        this.accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"];
        this.refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"];
        this.algorithm = "RS256";

        this.issuer = env.JWT_ISSUER || "http://localhost:3000";
        this.audience = env.JWT_AUDIENCE || "http://localhost:5173";
    }

    /**
     * Generates a pair of JWT access and refresh tokens for the given user ID and payload.
     * @param userId The user ID to set as the 'sub' claim in the token
     * @param payload Additional payload to include in the access token (e.g., email, roles)
     * @returns An object containing the generated access token and refresh token
     * @throws AppError with status 500 if token generation fails
     */
    public async generateTokens(userId: string, payload: object): Promise<AuthTokens> {
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

            // TODO: add schema for the sessions tables, then go from there.
            // const result = await db.

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
    public verifyToken(token: string): string | JwtPayload | null {
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
}
