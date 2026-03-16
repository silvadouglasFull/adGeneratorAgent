const mockInitChatModel = jest.fn();

jest.mock("langchain/chat_models/universal", () => ({
    initChatModel: (...args: unknown[]) => mockInitChatModel(...args),
}));

jest.mock("@langchain/core/prompts", () => ({
    ChatPromptTemplate: {
        fromMessages: jest.fn().mockReturnValue({
            pipe: jest.fn().mockReturnValue({
                invoke: jest.fn().mockResolvedValue({
                    content: "# Produto Test\n\n**Benefício principal**\n\n## ✨ Destaques\n\n- Item 1\n- Item 2\n\n## 🚀 Aproveite agora!\n\nCompre já!",
                }),
            }),
        }),
    },
}));

describe("Model Routing (addConditionalEdges)", () => {
    beforeEach(() => {
        process.env.GENAI_API = "fake-gemini-key";
        mockInitChatModel.mockReset();
        mockInitChatModel.mockResolvedValue({});
    });

    it("generateAd com model='gpt-4o-mini' usa initChatModel com provider openai", async () => {
        const { generateAd } = await import("../adGeneratorAgent");
        const state = {
            input: "Produto X",
            model: "gpt-4o-mini" as const,
            instructions: "Instruções do manual",
            ad: "",
        };

        const result = await generateAd(state);
        expect(result.ad).toBeDefined();
        expect(result.ad!.trimStart().startsWith("#")).toBe(true);
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gpt-4o-mini",
            expect.objectContaining({ modelProvider: "openai", temperature: 0.7, maxRetries: 0 })
        );
    });

    it("generateAd com model='gemini-2.0-flash' usa initChatModel com provider google-genai", async () => {
        const { generateAd } = await import("../adGeneratorAgent");
        const state = {
            input: "Produto Y",
            model: "gemini-2.0-flash" as const,
            instructions: "Instruções do manual",
            ad: "",
        };

        const result = await generateAd(state);
        expect(result.ad).toBeDefined();
        expect(result.ad!.trimStart().startsWith("#")).toBe(true);
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gemini-2.0-flash",
            expect.objectContaining({ modelProvider: "google-genai", apiKey: "fake-gemini-key", temperature: 0.7, maxRetries: 0 })
        );
    });

    it("generateAd com model undefined usa gpt-4o-mini como default", async () => {
        const { generateAd } = await import("../adGeneratorAgent");
        const state = {
            input: "Produto default",
            model: undefined,
            instructions: "Manual",
            ad: "",
        };

        const result = await generateAd(state);
        expect(result.ad).toBeDefined();
        expect(result.ad!.trimStart().startsWith("#")).toBe(true);
        expect(mockInitChatModel).toHaveBeenCalledWith(
            "gpt-4o-mini",
            expect.objectContaining({ modelProvider: "openai", temperature: 0.7, maxRetries: 0 })
        );
    });
});
