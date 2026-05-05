import { logger } from "../../../config/logger";
import { _argon2 } from "../../../lib/argon2";
import { db } from "../../../lib/db/orm/client";
import { JWT } from "../../../lib/jwt";
import { cacheSessionToken, isSessionTokenCached } from "./session-cache";

export const isSessionValid = async (token: string): Promise<boolean> => {
    try {
        const clientDecoded = JWT.verifyToken(token);

        const userId = clientDecoded?.sub!;

        const cached = await isSessionTokenCached(userId, token);
        if (cached) {
            return true;
        }

        const sessions = await db.sessions.findMany({
            where: {
                user_id: userId,
            },
            select: ["session_token", "expires_at"],
        });

        if (!sessions || sessions.length === 0) {
            logger.debug("Session not found for token:", { token: token });
            return false;
        }

        for (const session of sessions) {
            if (session.expires_at && session.expires_at.getTime() <= Date.now()) {
                continue;
            }

            const matches = await _argon2.verify(session.session_token, token);
            if (matches) {
                if (session.expires_at) {
                    await cacheSessionToken(userId, token, session.expires_at);
                }
                return true;
            }
        }

        logger.debug("Session not found for token:", { token: token });
        return false;
    } catch (error) {
        throw error;
    }
};
