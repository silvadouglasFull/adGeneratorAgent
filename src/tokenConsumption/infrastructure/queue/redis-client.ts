import Redis from "ioredis";

let redisClient: Redis | null = null;

function buildRedisUrl(): string {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    const host = process.env.REDIS_HOST || "localhost";
    const port = process.env.REDIS_PORT || "6379";
    const username = process.env.REDIS_USERNAME;
    const password = process.env.REDIS_PASSWORD;

    if (username && password) {
        return `redis://${username}:${password}@${host}:${port}`;
    }

    return `redis://${host}:${port}`;
}

export function getRedisClient(): Redis {
    if (redisClient) {
        return redisClient;
    }

    const redisUrl = buildRedisUrl();

    redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
    });

    redisClient.on("connect", () => {
        console.log("✓ Redis conectado");
    });

    redisClient.on("error", (error) => {
        console.error("✗ Erro no Redis:", error);
    });

    return redisClient;
}

export async function closeRedisClient(): Promise<void> {
    if (!redisClient) {
        return;
    }

    await redisClient.quit();
    redisClient = null;
}
