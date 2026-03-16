import { readFileSync } from "fs";
import { join } from "path";

// Mock do @langchain/openai e @langchain/core para evitar custo real em CI
jest.mock("@langchain/openai", () => ({
    ChatOpenAI: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue({ content: "# Produto X\n\n**O melhor produto**\n\n## ✨ Destaques\n\n- Item 1\n- Item 2\n\n## 🚀 Aproveite agora!\n\nCompre já!" }),
    })),
}));

jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue({ content: "# Produto Gemini\n\n**Texto de teste**" }),
    })),
}));

jest.mock("@langchain/core/prompts", () => ({
    ChatPromptTemplate: {
        fromMessages: jest.fn().mockReturnValue({
            pipe: jest.fn().mockReturnValue({
                invoke: jest.fn().mockResolvedValue({
                    content: "# Produto X\n\n**O melhor produto**\n\n## ✨ Destaques\n\n- Item 1\n- Item 2\n\n## 🚀 Aproveite agora!\n\nCompre já!",
                }),
            }),
        }),
    },
}));

describe("AdGeneratorAgent", () => {
    beforeEach(() => {
        process.env.GENAI_API = "fake-gemini-key";
    });

    it("deve retornar um Markdown que começa com #", async () => {
        const { adGeneratorAgent } = await import("../adGeneratorAgent");
        const result = await adGeneratorAgent.invoke({ input: "Produto X, R$99" });
        expect(result.ad).toBeDefined();
        expect(result.ad.trimStart().startsWith("#")).toBe(true);
    });

    it("deve carregar o arquivo instructions.md corretamente", () => {
        const instructionsPath = join(process.cwd(), "src", "agent", "instructions.md");
        const instructions = readFileSync(instructionsPath, "utf-8");
        expect(instructions).toBeTruthy();
        expect(instructions.length).toBeGreaterThan(0);
        expect(instructions).toContain("#");
    });

    it("deve retornar o campo instructions no estado após loadInstructions", async () => {
        const { adGeneratorAgent } = await import("../adGeneratorAgent");
        const result = await adGeneratorAgent.invoke({ input: "Tênis azul R$199" });
        expect(result.instructions).toBeDefined();
        expect(typeof result.instructions).toBe("string");
    });

    it("deve aceitar o modelo gemini-2.0-flash", async () => {
        const { adGeneratorAgent } = await import("../adGeneratorAgent");
        const result = await adGeneratorAgent.invoke({
            input: "Produto premium",
            model: "gemini-2.0-flash",
        });
        expect(result.ad).toBeDefined();
        expect(result.ad.trimStart().startsWith("#")).toBe(true);
    });
});
