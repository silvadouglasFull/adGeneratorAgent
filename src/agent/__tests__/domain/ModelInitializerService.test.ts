const mockChatOpenAI = jest.fn();
const mockChatGoogleGenerativeAI = jest.fn();

jest.mock("@langchain/openai", () => ({
    ChatOpenAI: jest.fn().mockImplementation((...args: unknown[]) => mockChatOpenAI(...args)),
}));

jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation((...args: unknown[]) => mockChatGoogleGenerativeAI(...args)),
}));

import { ModelRegistry } from "../../domain/model/ModelRegistry";
import type { IModelProviderFactory } from "../../domain/service/IModelProviderFactory";
import { ModelInitializerService } from "../../domain/service/ModelInitializerService";

describe("ModelInitializerService", () => {
    let service: ModelInitializerService;
    let registry: ModelRegistry;

    beforeEach(() => {
        process.env.GENAI_API = "test-gemini-key";
        registry = ModelRegistry.default();
        service = new ModelInitializerService(registry);
        mockChatOpenAI.mockReset();
        mockChatGoogleGenerativeAI.mockReset();
        mockChatOpenAI.mockReturnValue({});
        mockChatGoogleGenerativeAI.mockReturnValue({});
    });

    it("deve inicializar modelo openai corretamente", async () => {
        await service.initialize("gpt-4o-mini");
        expect(mockChatOpenAI).toHaveBeenCalledWith(
            expect.objectContaining({
                model: "gpt-4o-mini",
                temperature: 0.7,
                maxRetries: 0,
            })
        );
    });

    it("deve inicializar modelo google-genai corretamente", async () => {
        await service.initialize("gemini-2.0-flash");
        expect(mockChatGoogleGenerativeAI).toHaveBeenCalledWith(
            expect.objectContaining({
                model: "gemini-2.0-flash",
                apiKey: "test-gemini-key",
                temperature: 0.7,
                maxRetries: 0,
            })
        );
    });

    it("deve respeitar temperatura customizada", async () => {
        await service.initialize("gpt-4o-mini", 0.5);
        expect(mockChatOpenAI).toHaveBeenCalledWith(
            expect.objectContaining({ temperature: 0.5 })
        );
    });

    it("deve respeitar maxRetries customizado", async () => {
        await service.initialize("gpt-4o-mini", 0.7, 3);
        expect(mockChatOpenAI).toHaveBeenCalledWith(
            expect.objectContaining({ maxRetries: 3 })
        );
    });

    it("deve lançar exceção para modelo inválido", async () => {
        const invalidRegistry = new ModelRegistry({
            "gpt-4o-mini": { modelProvider: "openai" },
            "gemini-2.0-flash": { modelProvider: "google-genai" },
            "gpt-image-1.5": { modelProvider: "openai-image" },
        });
        const invalidService = new ModelInitializerService(invalidRegistry);

        await expect(invalidService.initialize("modelo-invalido" as never)).rejects.toThrow("não configurado");
    });

    describe("com ModelProviderFactory injetado", () => {
        it("deve delegar para o factory quando disponível", async () => {
            const mockModel = { _type: "mock-model" };
            const mockFactory: IModelProviderFactory = {
                create: jest.fn().mockReturnValue(mockModel),
            };
            const serviceWithFactory = new ModelInitializerService(registry, mockFactory);

            const result = await serviceWithFactory.initialize("gpt-4o-mini");

            expect(mockFactory.create).toHaveBeenCalledWith("gpt-4o-mini");
            expect(result).toBe(mockModel);
            expect(mockChatOpenAI).not.toHaveBeenCalled();
        });

        it("deve usar instanciação direta quando factory não fornecido", async () => {
            const serviceWithoutFactory = new ModelInitializerService(registry);

            await serviceWithoutFactory.initialize("gpt-4o-mini");

            expect(mockChatOpenAI).toHaveBeenCalled();
        });
    });
});
