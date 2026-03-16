/* eslint-disable @typescript-eslint/no-explicit-any */
const mockInitChatModel = jest.fn();

jest.mock("langchain/chat_models/universal", () => ({
    initChatModel: (...args: unknown[]) => mockInitChatModel(...args),
}));

jest.mock("../../prompt", () => ({
    adGeneratorPrompt: {
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue({
                content: "# Produto Teste\n\n**Benefício**\n\nCompre agora!",
            }),
        }),
    },
}));

import { AdGeneratorGraphBuilder } from "../../application/graph/AdGeneratorGraphBuilder";
import { ModelRegistry } from "../../domain/model/ModelRegistry";
import { AdGenerationService } from "../../domain/service/AdGenerationService";
import { InstructionService } from "../../domain/service/InstructionService";
import { ModelInitializerService } from "../../domain/service/ModelInitializerService";
import { OutputValidationService } from "../../domain/service/OutputValidationService";
import { adGeneratorPrompt } from "../../prompt";

describe("AdGeneratorGraphBuilder", () => {
    let graph: any;

    beforeEach(() => {
        process.env.GENAI_API = "test-key";
        const registry = ModelRegistry.default();
        const instructionService = new InstructionService();
        const modelInitializer = new ModelInitializerService(registry);
        const adGenerationService = new AdGenerationService(modelInitializer, adGeneratorPrompt as any);
        const validationService = new OutputValidationService();

        graph = AdGeneratorGraphBuilder.build(
            instructionService,
            modelInitializer,
            adGenerationService,
            validationService
        );
        mockInitChatModel.mockReset();
        mockInitChatModel.mockResolvedValue({});
    });

    it("deve compilar grafo sem erros", () => {
        const compiled = graph.compile();
        expect(compiled).toBeTruthy();
    });

    it("compiled graph deve ter método invoke", () => {
        const compiled = graph.compile();
        expect(typeof compiled.invoke).toBe("function");
    });

    it("compiled graph deve processar input e retornar ad", async () => {
        const compiled = graph.compile();
        const result = await compiled.invoke({ input: "Produto X" });
        expect(result).toBeTruthy();
        expect(result.ad).toBeTruthy();
        expect(typeof result.ad).toBe("string");
    });

    it("compiled graph deve carregar instructions", async () => {
        const compiled = graph.compile();
        const result = await compiled.invoke({ input: "Produto Y" });
        expect(result.instructions).toBeTruthy();
        expect(typeof result.instructions).toBe("string");
    });

    it("compiled graph deve validar output Markdown", async () => {
        const compiled = graph.compile();
        const result = await compiled.invoke({ input: "Produto Z" });
        expect(result.ad.startsWith("#")).toBe(true);
    });
});
