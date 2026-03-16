import { OpenAIModelsProvider } from "@/agent/infrastructure/providers/OpenAIModelsProvider";

describe("OpenAIModelsProvider", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("filtra modelos aptos a chat/generation", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [
                    { id: "gpt-4o-mini" },
                    { id: "gpt-4.1-mini" },
                    { id: "text-embedding-3-small" },
                ],
            }),
        });

        const provider = new OpenAIModelsProvider();
        const result = await provider.getAvailableModels("key");

        expect(result).toEqual([
            { name: "gpt-4o-mini", provider: "openai", isFree: false },
            { name: "gpt-4.1-mini", provider: "openai", isFree: false },
        ]);
    });

    it("retorna [] quando payload não possui data", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        const provider = new OpenAIModelsProvider();
        const result = await provider.getAvailableModels("key");

        expect(result).toEqual([]);
    });

    it("lança erro em falha de integração", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({}),
        });

        const provider = new OpenAIModelsProvider();
        await expect(provider.getAvailableModels("key")).rejects.toThrow();
    });
});
