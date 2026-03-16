/* eslint-disable @typescript-eslint/no-explicit-any */

const mockChatOpenAI = jest.fn();
const mockChatGoogleGenerativeAI = jest.fn();

jest.mock("@langchain/openai", () => ({
    ChatOpenAI: jest.fn().mockImplementation((...args: unknown[]) => mockChatOpenAI(...args)),
}));

jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation((...args: unknown[]) => mockChatGoogleGenerativeAI(...args)),
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

import { AdGenerationRequest } from "../../domain/model/AdGenerationRequest";
import { ModelRegistry } from "../../domain/model/ModelRegistry";
import { AdGenerationService } from "../../domain/service/AdGenerationService";
import { ModelInitializerService } from "../../domain/service/ModelInitializerService";
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
        mockChatOpenAI.mockReset();
        mockChatGoogleGenerativeAI.mockReset();
        mockChatOpenAI.mockReturnValue({});
        mockChatGoogleGenerativeAI.mockReturnValue({});
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
        expect(mockChatGoogleGenerativeAI).toHaveBeenCalledWith(
            expect.objectContaining({ model: "gemini-2.0-flash" })
        );
    });

    it("deve retornar string válida", async () => {
        const request = AdGenerationRequest.create("Produto", "Instruções");
        const result = await service.generate(request);
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
    });
});
