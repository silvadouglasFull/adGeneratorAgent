const mockInitChatModel = jest.fn();

jest.mock("langchain/chat_models/universal", () => ({
    initChatModel: (...args: unknown[]) => mockInitChatModel(...args),
}));

import { ModelRegistry } from "../../domain/model/ModelRegistry";
import { ModelInitializerService } from "../../domain/service/ModelInitializerService";

describe("ModelInitializerService", () => {
    let service: ModelInitializerService;
    let registry: ModelRegistry;

    beforeEach(() => {
        process.env.GENAI_API = "test-gemini-key";
        registry = ModelRegistry.default();
        service = new ModelInitializerService(registry);
        mockInitChatModel.mockReset();
        mockInitChatModel.mockResolvedValue({});
    });

    it("deve inicializar modelo openai corretamente", async () => {
        await service.initialize("gpt-4o-mini");
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gpt-4o-mini",
            expect.objectContaining({
                modelProvider: "openai",
                temperature: 0.7,
                maxRetries: 0,
            })
        );
    });

    it("deve inicializar modelo google-genai corretamente", async () => {
        await service.initialize("gemini-2.0-flash");
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gemini-2.0-flash",
            expect.objectContaining({
                modelProvider: "google-genai",
                apiKey: "test-gemini-key",
                temperature: 0.7,
                maxRetries: 0,
            })
        );
    });

    it("deve respeitar temperatura customizada", async () => {
        await service.initialize("gpt-4o-mini", 0.5);
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gpt-4o-mini",
            expect.objectContaining({ temperature: 0.5 })
        );
    });

    it("deve respeitar maxRetries customizado", async () => {
        await service.initialize("gpt-4o-mini", 0.7, 3);
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gpt-4o-mini",
            expect.objectContaining({ maxRetries: 3 })
        );
    });

    it("deve lançar exceção para modelo inválido", async () => {
        const invalidRegistry = new ModelRegistry({
            "gpt-4o-mini": { modelProvider: "openai" },
            "gemini-2.0-flash": { modelProvider: "google-genai" },
        });
        const invalidService = new ModelInitializerService(invalidRegistry);

        try {
            await invalidService.initialize("modelo-invalido" as any);
            fail("Deveria ter lançado exceção");
        } catch (error: any) {
            expect(error.message).toContain("não configurado");
        }
    });
});
