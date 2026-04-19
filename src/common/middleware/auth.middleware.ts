import jwt from "jsonwebtoken";

import type { RequestHandler } from "express";

import type { AuthTokenPayload } from "../../modules/auth/auth.types";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

// Paths that require authentication.
const PROTECTED_PATHS = ["/api/v1/auth/me"];

const authMiddleware: RequestHandler = (req, _res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        next(
            new AppError({
                statusCode: 401,
                code: "AUTH_UNAUTHORIZED",
                message: "Missing or invalid Authorization header",
            })
        );
        return;
    }

    const token = authorization.replace("Bearer ", "").trim();

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

        req.auth = {
            userId: payload.userId,
            email: payload.email,
        };

        next();
    } catch {
        next(
            new AppError({
                statusCode: 401,
                code: "AUTH_INVALID_TOKEN",
                message: "Invalid or expired token",
            })
        );
    }
};

export { authMiddleware };
