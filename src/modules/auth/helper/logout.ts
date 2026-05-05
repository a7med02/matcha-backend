import { StatusCodes } from "http-status-codes";

import { AppError } from "../../../common/errors/app-error";
import { logger } from "../../../config/logger";
import { _argon2 } from "../../../lib/argon2";
import { db } from "../../../lib/db/orm/client";
import { redis } from "../../../lib/redis/client";
import { JWT } from "../../../lib/jwt";
import { clearSessionCacheForUser, removeSessionTokenFromCache } from "./session-cache";

export const revokeSessionByToken = async (token: string): Promise<boolean> => {
    const decoded = JWT.verifyToken(token);
    const userId = decoded?.sub;

    if (!userId) {
        throw new AppError({
            statusCode: StatusCodes.UNAUTHORIZED,
            code: "AUTH_INVALID_TOKEN",
            message: "Invalid or expired token",
        });
    }

    const sessions = await db.sessions.findMany({
        where: {
            user_id: userId,
        },
        select: ["id", "session_token", "expires_at"],
    });

    if (!sessions || sessions.length === 0) {
        logger.debug("Session not found for logout token", { token: token });
        return false;
    }

    for (const session of sessions) {
        if (session.expires_at && session.expires_at.getTime() <= Date.now()) {
            continue;
        }

        const matches = await _argon2.verify(session.session_token, token);
        if (matches) {
            await db.sessions.delete({
                where: {
                    id: session.id,
                },
            });

            await removeSessionTokenFromCache(userId, token);
            await redis.del(`auth:sessions:${userId}:oldest_expiry`);
            await redis.decr(`auth:sessions:${userId}:count`);

            return true;
        }
    }

    logger.debug("Session not found for logout token", { token: token });
    return false;
};

export const revokeAllSessionsByToken = async (token: string): Promise<number> => {
    const decoded = JWT.verifyToken(token);
    const userId = decoded?.sub;

    if (!userId) {
        throw new AppError({
            statusCode: StatusCodes.UNAUTHORIZED,
            code: "AUTH_INVALID_TOKEN",
            message: "Invalid or expired token",
        });
    }

    const deletedSessions = await db.sessions.delete({
        where: {
            user_id: userId,
        },
    });

    await clearSessionCacheForUser(userId);
    await redis.del(`auth:sessions:${userId}:oldest_expiry`);
    await redis.del(`auth:sessions:${userId}:count`);

    return deletedSessions.length;
};
