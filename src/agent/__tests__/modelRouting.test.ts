
// Mock de ambos os modelos de IA
jest.mock("@langchain/openai", () => ({
    ChatOpenAI: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue({
            content: "# Produto OpenAI\n\n**Benefício principal**\n\n## ✨ Destaques\n\n- Qualidade\n- Velocidade\n\n## 🚀 Aproveite agora!\n\nCompre já!",
        }),
    })),
}));

jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue({
            content: "# Produto Gemini\n\n**Benefício principal**\n\n## ✨ Destaques\n\n- Qualidade\n- Velocidade\n\n## 🚀 Aproveite agora!\n\nCompre já!",
        }),
    })),
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
    });

    it("routeToModel com model='gpt-4o-mini' retorna 'generateAd_openai'", async () => {
        const { routeToModel } = await import("../adGeneratorAgent");
        const state = { input: "Produto X", model: "gpt-4o-mini" as const, instructions: "", ad: "" };
        const result = routeToModel(state);
        expect(result).toBe("generateAd_openai");
    });

    it("routeToModel com model='gemini-2.0-flash' retorna 'generateAd_gemini'", async () => {
        const { routeToModel } = await import("../adGeneratorAgent");
        const state = { input: "Produto X", model: "gemini-2.0-flash" as const, instructions: "", ad: "" };
        const result = routeToModel(state);
        expect(result).toBe("generateAd_gemini");
    });

    it("routeToModel com model undefined retorna 'generateAd_openai' (default)", async () => {
        const { routeToModel } = await import("../adGeneratorAgent");
        const state = { input: "Produto X", model: undefined, instructions: "", ad: "" };
        const result = routeToModel(state);
        expect(result).toBe("generateAd_openai");
    });

    it("nó generateAd_openai produz output Markdown válido (começa com #)", async () => {
        const { generateAd_openai } = await import("../adGeneratorAgent");
        const state = {
            input: "Tênis azul",
            model: "gpt-4o-mini" as const,
            instructions: "Instruções do manual",
            ad: "",
        };
        const result = await generateAd_openai(state);
        expect(result.ad).toBeDefined();
        expect(result.ad!.trimStart().startsWith("#")).toBe(true);
    });

    it("nó generateAd_gemini produz output Markdown válido (começa com #)", async () => {
        const { generateAd_gemini } = await import("../adGeneratorAgent");
        const state = {
            input: "Tênis azul",
            model: "gemini-2.0-flash" as const,
            instructions: "Instruções do manual",
            ad: "",
        };
        const result = await generateAd_gemini(state);
        expect(result.ad).toBeDefined();
        expect(result.ad!.trimStart().startsWith("#")).toBe(true);
    });

    it("ambos os nós (openai e gemini) retornam diferentes outputs", async () => {
        const { generateAd_openai, generateAd_gemini } = await import("../adGeneratorAgent");
        const stateOpenAi = {
            input: "Produto X",
            model: "gpt-4o-mini" as const,
            instructions: "Manual",
            ad: "",
        };
        const stateGemini = {
            input: "Produto X",
            model: "gemini-2.0-flash" as const,
            instructions: "Manual",
            ad: "",
        };

        const resultOpenAi = await generateAd_openai(stateOpenAi);
        const resultGemini = await generateAd_gemini(stateGemini);

        expect(resultOpenAi.ad).toBeTruthy();
        expect(resultGemini.ad).toBeTruthy();
        // Ambos devem ter formato Markdown válido
        expect(resultOpenAi.ad!.startsWith("#")).toBe(true);
        expect(resultGemini.ad!.startsWith("#")).toBe(true);
    });

    it("routeToModel é consistente para mesmo input", async () => {
        const { routeToModel } = await import("../adGeneratorAgent");
        const stateA = { input: "Produto", model: "gpt-4o-mini" as const, instructions: "", ad: "" };
        const stateB = { input: "Produto", model: "gpt-4o-mini" as const, instructions: "", ad: "" };

        const resultA = routeToModel(stateA);
        const resultB = routeToModel(stateB);

        expect(resultA).toBe(resultB);
        expect(resultA).toBe("generateAd_openai");
    });
});
