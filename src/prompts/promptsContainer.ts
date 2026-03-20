import { DefaultPromptSeeder } from "@/prompts/domain/service/DefaultPromptSeeder";
import { PromptFetchService } from "@/prompts/domain/service/PromptFetchService";
import { UserPromptPostgresRepository } from "@/prompts/infrastructure/postgres/UserPromptPostgresRepository";
import { PromptRedisSync } from "@/prompts/infrastructure/redis/PromptRedisSync";
import { getRedisClient } from "@/tokenConsumption/infrastructure/queue/redis-client";

const redisClient = getRedisClient();
const promptRedisSync = new PromptRedisSync(redisClient);
const userPromptRepository = new UserPromptPostgresRepository(undefined, promptRedisSync);
const promptFetchService = new PromptFetchService(
    redisClient,
    userPromptRepository,
    promptRedisSync
);
const defaultPromptSeeder = new DefaultPromptSeeder(userPromptRepository);

export const promptsContainer = {
    redisClient,
    promptRedisSync,
    userPromptRepository,
    promptFetchService,
    defaultPromptSeeder,
};
