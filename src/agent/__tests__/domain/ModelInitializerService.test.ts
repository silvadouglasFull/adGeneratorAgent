const mockChatOpenAI = jest.fn();
const mockChatGoogleGenerativeAI = jest.fn();

jest.mock("@langchain/openai", () => ({
    ChatOpenAI: jest.fn().mockImplementation((...args: unknown[]) => mockChatOpenAI(...args)),
}));

jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation((...args: unknown[]) => mockChatGoogleGenerativeAI(...args)),
}));

import { ModelRegistry } from "../../domain/model/ModelRegistry";
import type { ILiteLLMProxyProvider } from "../../domain/service/ILiteLLMProxyProvider";
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

            expect(mockFactory.create).toHaveBeenCalledWith("gpt-4o-mini", undefined);
            expect(result).toBe(mockModel);
            expect(mockChatOpenAI).not.toHaveBeenCalled();
        });

        it("deve usar instanciação direta quando factory não fornecido", async () => {
            const serviceWithoutFactory = new ModelInitializerService(registry);

            await serviceWithoutFactory.initialize("gpt-4o-mini");

            expect(mockChatOpenAI).toHaveBeenCalled();
        });
    });

    describe("com LiteLLMProxyProvider injetado", () => {
        let mockLiteLLMProvider: jest.Mocked<ILiteLLMProxyProvider>;

        beforeEach(() => {
            mockLiteLLMProvider = {
                create: jest.fn().mockReturnValue({ _type: "litellm-model" }),
                isAvailable: jest.fn(),
            };
        });

        it("deve usar LiteLLM para modelo de texto quando disponível", async () => {
            mockLiteLLMProvider.isAvailable.mockResolvedValue(true);
            const serviceWithLiteLLM = new ModelInitializerService(registry, undefined, mockLiteLLMProvider);

            const result = await serviceWithLiteLLM.initialize("gpt-4o-mini");

            expect(mockLiteLLMProvider.isAvailable).toHaveBeenCalled();
            expect(mockLiteLLMProvider.create).toHaveBeenCalledWith("gpt-4o-mini", undefined);
            expect(result).toEqual({ _type: "litellm-model" });
            expect(mockChatOpenAI).not.toHaveBeenCalled();
        });

        it("deve usar chamada direta quando LiteLLM está indisponível", async () => {
            mockLiteLLMProvider.isAvailable.mockResolvedValue(false);
            const serviceWithLiteLLM = new ModelInitializerService(registry, undefined, mockLiteLLMProvider);

            await serviceWithLiteLLM.initialize("gpt-4o-mini");

            expect(mockLiteLLMProvider.isAvailable).toHaveBeenCalled();
            expect(mockLiteLLMProvider.create).not.toHaveBeenCalled();
            expect(mockChatOpenAI).toHaveBeenCalled();
        });

        it("deve usar chamada direta quando LiteLLM não está configurado", async () => {
            const serviceWithoutLiteLLM = new ModelInitializerService(registry);

            await serviceWithoutLiteLLM.initialize("gemini-2.0-flash");

            expect(mockChatGoogleGenerativeAI).toHaveBeenCalled();
        });

        it("deve NÃO usar LiteLLM para modelo de imagem mesmo quando disponível", async () => {
            mockLiteLLMProvider.isAvailable.mockResolvedValue(true);
            const mockFactory: IModelProviderFactory = {
                create: jest.fn().mockReturnValue({ _type: "direct-model" }),
            };
            const serviceWithBoth = new ModelInitializerService(registry, mockFactory, mockLiteLLMProvider);

            await serviceWithBoth.initialize("gpt-image-1.5");

            expect(mockLiteLLMProvider.isAvailable).not.toHaveBeenCalled();
            expect(mockLiteLLMProvider.create).not.toHaveBeenCalled();
            expect(mockFactory.create).toHaveBeenCalledWith("gpt-image-1.5", undefined);
        });

        it("deve priorizar LiteLLM sobre ModelProviderFactory para texto", async () => {
            mockLiteLLMProvider.isAvailable.mockResolvedValue(true);
            const mockFactory: IModelProviderFactory = {
                create: jest.fn().mockReturnValue({ _type: "factory-model" }),
            };
            const serviceWithBoth = new ModelInitializerService(registry, mockFactory, mockLiteLLMProvider);

            const result = await serviceWithBoth.initialize("gpt-4o-mini");

            expect(mockLiteLLMProvider.create).toHaveBeenCalledWith("gpt-4o-mini", undefined);
            expect(mockFactory.create).not.toHaveBeenCalled();
            expect(result).toEqual({ _type: "litellm-model" });
        });
    });
});
