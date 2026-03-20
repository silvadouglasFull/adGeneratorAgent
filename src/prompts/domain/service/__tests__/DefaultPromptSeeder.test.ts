import { IUserPromptRepository } from "@/prompts/application/repository/IUserPromptRepository";
import { UserPrompt } from "@/prompts/domain/entity/UserPrompt";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import {
    DEFAULT_IMAGE_GENERATION_PROMPT,
    DEFAULT_TEXT_GENERATION_PROMPT,
} from "@/prompts/domain/seed/defaultPromptContents";
import { DefaultPromptSeeder } from "@/prompts/domain/service/DefaultPromptSeeder";

const makeUserPrompt = (overrides: Partial<ConstructorParameters<typeof UserPrompt>[0]> = {}): UserPrompt =>
    new UserPrompt({
        id: "prompt-id",
        userId: "user-id",
        type: PromptType.TEXT_GENERATION,
        content: "some content",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

const makeRepository = (): jest.Mocked<IUserPromptRepository> => ({
    create: jest.fn(),
    findByUserIdAndType: jest.fn(),
    findActiveByUserIdAndType: jest.fn(),
    findAllByUserId: jest.fn(),
    findById: jest.fn(),
    setActive: jest.fn(),
    setInactive: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
});

describe("DefaultPromptSeeder", () => {
    const userId = "user-123";

    it("cria os dois prompts quando o usuário não tem nenhum", async () => {
        const repository = makeRepository();
        repository.findByUserIdAndType.mockResolvedValue(null);
        repository.create.mockResolvedValue(makeUserPrompt());

        const seeder = new DefaultPromptSeeder(repository);
        await seeder.seedForUser(userId);

        expect(repository.create).toHaveBeenCalledTimes(2);
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                type: PromptType.TEXT_GENERATION,
                content: DEFAULT_TEXT_GENERATION_PROMPT,
                isActive: true,
            })
        );
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                type: PromptType.IMAGE_GENERATION,
                content: DEFAULT_IMAGE_GENERATION_PROMPT,
                isActive: true,
            })
        );
    });

    it("cria apenas IMAGE_GENERATION quando TEXT_GENERATION já existe", async () => {
        const repository = makeRepository();
        repository.findByUserIdAndType
            .mockResolvedValueOnce(makeUserPrompt({ type: PromptType.TEXT_GENERATION }))
            .mockResolvedValueOnce(null);
        repository.create.mockResolvedValue(makeUserPrompt({ type: PromptType.IMAGE_GENERATION }));

        const seeder = new DefaultPromptSeeder(repository);
        await seeder.seedForUser(userId);

        expect(repository.create).toHaveBeenCalledTimes(1);
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: PromptType.IMAGE_GENERATION })
        );
    });

    it("não chama create quando ambos os tipos já existem", async () => {
        const repository = makeRepository();
        repository.findByUserIdAndType
            .mockResolvedValueOnce(makeUserPrompt({ type: PromptType.TEXT_GENERATION }))
            .mockResolvedValueOnce(makeUserPrompt({ type: PromptType.IMAGE_GENERATION }));

        const seeder = new DefaultPromptSeeder(repository);
        await seeder.seedForUser(userId);

        expect(repository.create).not.toHaveBeenCalled();
    });

    it("propaga o erro quando repository.create lança exceção", async () => {
        const repository = makeRepository();
        repository.findByUserIdAndType.mockResolvedValue(null);
        repository.create.mockRejectedValue(new Error("DB error"));

        const seeder = new DefaultPromptSeeder(repository);

        await expect(seeder.seedForUser(userId)).rejects.toThrow("DB error");
    });
});
