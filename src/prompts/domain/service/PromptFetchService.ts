import { IUserPromptRepository } from "@/prompts/application/repository/IUserPromptRepository";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import { ActivePromptNotFoundError } from "@/prompts/domain/exception/ActivePromptNotFoundError";
import {
    buildUserPromptRedisKey,
    PromptRedisSync,
} from "@/prompts/infrastructure/redis/PromptRedisSync";
import Redis from "ioredis";

export class PromptFetchService {
    constructor(
        private readonly redis: Redis,
        private readonly repository: IUserPromptRepository,
        private readonly redisSync: PromptRedisSync
    ) { }

    async fetchActivePrompt(userId: string, type: PromptType): Promise<string> {
        const key = buildUserPromptRedisKey(userId, type);
        const cachedPrompt = await this.redis.get(key);

        if (cachedPrompt) {
            return cachedPrompt;
        }

        const activePrompt = await this.repository.findActiveByUserIdAndType(userId, type);

        if (!activePrompt) {
            throw new ActivePromptNotFoundError(type);
        }

        this.redisSync.syncActivePromptToRedis(userId, type, activePrompt.content);

        return activePrompt.content;
    }
}
