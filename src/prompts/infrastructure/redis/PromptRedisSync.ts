import { PromptType } from "@/prompts/domain/enum/PromptType";
import Redis from "ioredis";

const PROMPT_TTL_SECONDS = 60 * 60 * 24;

export function buildUserPromptRedisKey(userId: string, type: PromptType): string {
    return `user-prompt:${userId}:${type}`;
}

export class PromptRedisSync {
    constructor(private readonly redis: Redis) { }

    syncActivePromptToRedis(userId: string, type: PromptType, content: string): void {
        const key = buildUserPromptRedisKey(userId, type);

        this.redis
            .set(key, content, "EX", PROMPT_TTL_SECONDS)
            .catch((error) => {
                console.error("Falha ao sincronizar prompt ativo no Redis", error);
            });
    }

    removePromptFromRedis(userId: string, type: PromptType): void {
        const key = buildUserPromptRedisKey(userId, type);

        this.redis.del(key).catch((error) => {
            console.error("Falha ao remover prompt do Redis", error);
        });
    }
}
