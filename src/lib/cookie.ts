import { Response, CookieOptions } from "express";

import { env } from "../config/env";
import { logger } from "../config/logger";
import { AuthTokens } from "./jwt";

export class AuthCookie {
    private isProduction: boolean;

    constructor() {
        this.isProduction = env.NODE_ENV === "production";
        if (!this.isProduction) logger.warn("Using non-production cookie settings");
    }

    /**
     * The baseline security rules applied to EVERY auth cookie.
     */
    private getBaseOptions(): CookieOptions {
        return {
            httpOnly: true, // CRITICAL: Blocks frontend JavaScript (XSS protection)
            secure: this.isProduction, // CRITICAL: Requires HTTPS (Packet Sniffing protection)
            sameSite: "strict", // CRITICAL: Blocks cross-origin requests (CSRF protection)
        };
    }

    /**
     * Attaches the freshly generated tokens to the HTTP Response.
     */
    public setAuthCookies(res: Response, tokens: AuthTokens): void {
        // It needs to be sent with every normal API request, so path is "/"
        res.cookie("access_token", tokens.accessToken, {
            ...this.getBaseOptions(),
            maxAge: env.JWT_ACCESS_EXPIRATION_SECONDS * 1_000,
            path: env.ACCESS_TOKEN_PATH || "/",
        });

        // It should ONLY ever be sent when hitting the refresh endpoint
        res.cookie("refresh_token", tokens.refreshToken, {
            ...this.getBaseOptions(),
            maxAge: env.JWT_REFRESH_EXPIRATION_SECONDS * 1_000,
            path: env.REFRESH_TOKEN_PATH || "/api/v1/auth/refresh",
        });
    }

    /**
     * Destroys the cookies when the user logs out.
     */
    public clearAuthCookies(res: Response): void {
        res.clearCookie("access_token", { path: env.ACCESS_TOKEN_PATH || "/" });
        res.clearCookie("refresh_token", { path: env.REFRESH_TOKEN_PATH || "/api/v1/auth/refresh" });
    }
}
