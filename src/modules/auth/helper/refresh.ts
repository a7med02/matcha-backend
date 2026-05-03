import { CRYPTO } from "../../../lib/crypto";
import { db } from "../../../lib/db/orm/client";
import { JWT } from "../../../lib/jwt";

export const isSessionValid = async (token: string): Promise<boolean> => {
    try {
        const clientDecoded = JWT.verifyToken(token);

        const session = await db.sessions.findUnique({
            where: {
                user_id: clientDecoded?.sub!,
                session_token: CRYPTO.encrypt(token),
            },
            select: ["expires_at"],
        });

        if (!session) {
            return false;
        }
        return true;
    } catch (error) {
        throw error;
    }
};
