import { createHash } from "node:crypto";

import { redis } from "../../../lib/redis/client";

const buildSessionTokenCacheKey = (userId: string, tokenHash: string): string => {
    return `auth:session:${userId}:${tokenHash}`;
};

const buildSessionTokenIndexKey = (userId: string): string => {
    return `auth:session:${userId}:tokens`;
};

const hashSessionToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};

const getSecondsUntil = (expiresAt: Date): number => {
    return Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
};

export const cacheSessionToken = async (
    userId: string,
    token: string,
    expiresAt: Date
): Promise<string> => {
    const tokenHash = hashSessionToken(token);
    const key = buildSessionTokenCacheKey(userId, tokenHash);
    const indexKey = buildSessionTokenIndexKey(userId);
    const ttlSeconds = getSecondsUntil(expiresAt);

    await redis.set(key, "1", { EX: ttlSeconds });
    await redis.sAdd(indexKey, tokenHash);
    await redis.expire(indexKey, ttlSeconds);

    return tokenHash;
};

export const isSessionTokenCached = async (userId: string, token: string): Promise<boolean> => {
    const tokenHash = hashSessionToken(token);
    const key = buildSessionTokenCacheKey(userId, tokenHash);
    return await redis.exists(key);
};

export const removeSessionTokenFromCache = async (userId: string, token: string): Promise<void> => {
    const tokenHash = hashSessionToken(token);
    const key = buildSessionTokenCacheKey(userId, tokenHash);
    const indexKey = buildSessionTokenIndexKey(userId);

    await redis.del(key);
    await redis.sRem(indexKey, tokenHash);
};

export const clearSessionCacheForUser = async (userId: string): Promise<void> => {
    const indexKey = buildSessionTokenIndexKey(userId);
    const hashes = await redis.sMembers(indexKey);

    for (const tokenHash of hashes) {
        const key = buildSessionTokenCacheKey(userId, tokenHash);
        await redis.del(key);
    }

    await redis.del(indexKey);
};
