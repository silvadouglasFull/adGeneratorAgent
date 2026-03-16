import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
    if (redisClient) {
        return redisClient;
    }

    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

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
