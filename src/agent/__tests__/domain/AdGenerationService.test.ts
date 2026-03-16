const mockInitChatModel = jest.fn();

jest.mock("langchain/chat_models/universal", () => ({
    initChatModel: (...args: unknown[]) => mockInitChatModel(...args),
}));

jest.mock("../../prompt", () => ({
    adGeneratorPrompt: {
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue({
                content: "# Produto Test\n\nDescrição do anúncio",
            }),
        }),
    },
}));

import { AdGenerationService } from "../../domain/service/AdGenerationService";
import { ModelInitializerService } from "../../domain/service/ModelInitializerService";
import { ModelRegistry } from "../../domain/model/ModelRegistry";
import { AdGenerationRequest } from "../../domain/model/AdGenerationRequest";
import { adGeneratorPrompt } from "../../prompt";

describe("AdGenerationService", () => {
    let service: AdGenerationService;
    let modelInitializer: ModelInitializerService;
    let registry: ModelRegistry;

    beforeEach(() => {
        process.env.GENAI_API = "test-key";
        registry = ModelRegistry.default();
        modelInitializer = new ModelInitializerService(registry);
        service = new AdGenerationService(modelInitializer, adGeneratorPrompt as any);
        mockInitChatModel.mockReset();
        mockInitChatModel.mockResolvedValue({});
    });

    it("deve gerar anúncio com modelo padrão", async () => {
        const request = AdGenerationRequest.create("Produto X", "Instruções");
        const result = await service.generate(request);
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
    });

    it("deve usar modelo customizado", async () => {
        const request = AdGenerationRequest.create("Produto", "Instruções", "gemini-2.0-flash");
        await service.generate(request);
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gemini-2.0-flash",
            expect.any(Object)
        );
    });

    it("deve retornar string válida", async () => {
        const request = AdGenerationRequest.create("Produto", "Instruções");
        const result = await service.generate(request);
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
    });
});
