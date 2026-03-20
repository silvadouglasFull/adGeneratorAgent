import { IUserPromptRepository } from "@/prompts/application/repository/IUserPromptRepository";
import { UserPrompt } from "@/prompts/domain/entity/UserPrompt";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import { ActivePromptNotFoundError } from "@/prompts/domain/exception/ActivePromptNotFoundError";
import { PromptFetchService } from "@/prompts/domain/service/PromptFetchService";
import { PromptRedisSync } from "@/prompts/infrastructure/redis/PromptRedisSync";

function createPrompt(): UserPrompt {
    return new UserPrompt({
        id: "prompt-id",
        userId: "user-id",
        type: PromptType.TEXT_GENERATION,
        content: "conteudo de prompt ativo",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}

describe("PromptFetchService", () => {
    it("deve retornar prompt ativo do Redis quando cache existir", async () => {
        const redis = {
            get: jest.fn().mockResolvedValue("cache prompt"),
        } as any;

        const repository = {
            findActiveByUserIdAndType: jest.fn(),
        } as unknown as IUserPromptRepository;

        const redisSync = {
            syncActivePromptToRedis: jest.fn(),
        } as unknown as PromptRedisSync;

        const service = new PromptFetchService(redis, repository, redisSync);
        const result = await service.fetchActivePrompt("user-id", PromptType.TEXT_GENERATION);

        expect(result).toBe("cache prompt");
        expect(repository.findActiveByUserIdAndType).not.toHaveBeenCalled();
    });

    it("deve buscar no Postgres e sincronizar no Redis em cache miss", async () => {
        const redis = {
            get: jest.fn().mockResolvedValue(null),
        } as any;

        const repository = {
            findActiveByUserIdAndType: jest.fn().mockResolvedValue(createPrompt()),
        } as unknown as IUserPromptRepository;

        const redisSync = {
            syncActivePromptToRedis: jest.fn(),
        } as unknown as PromptRedisSync;

        const service = new PromptFetchService(redis, repository, redisSync);
        const result = await service.fetchActivePrompt("user-id", PromptType.TEXT_GENERATION);

        expect(result).toBe("conteudo de prompt ativo");
        expect(redisSync.syncActivePromptToRedis).toHaveBeenCalledWith(
            "user-id",
            PromptType.TEXT_GENERATION,
            "conteudo de prompt ativo"
        );
    });

    it("deve lançar ActivePromptNotFoundError quando não houver prompt ativo", async () => {
        const redis = {
            get: jest.fn().mockResolvedValue(null),
        } as any;

        const repository = {
            findActiveByUserIdAndType: jest.fn().mockResolvedValue(null),
        } as unknown as IUserPromptRepository;

        const redisSync = {
            syncActivePromptToRedis: jest.fn(),
        } as unknown as PromptRedisSync;

        const service = new PromptFetchService(redis, repository, redisSync);

        await expect(
            service.fetchActivePrompt("user-id", PromptType.TEXT_GENERATION)
        ).rejects.toBeInstanceOf(ActivePromptNotFoundError);
    });
});
