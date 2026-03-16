import { GoogleModelsProvider } from "@/agent/infrastructure/providers/GoogleModelsProvider";

describe("GoogleModelsProvider", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("retorna [] quando payload não possui models", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        const provider = new GoogleModelsProvider();
        const result = await provider.getAvailableModels("key");

        expect(result).toEqual([]);
    });

    it("filtra modelos sem suporte de geração e task-specific", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                models: [
                    {
                        name: "models/gemini-2.0-flash",
                        supportedGenerationMethods: ["generateContent"],
                    },
                    {
                        name: "models/text-embedding-004",
                        supportedGenerationMethods: ["embedContent"],
                    },
                    {
                        name: "models/aqa-model",
                        supportedGenerationMethods: ["generateContent"],
                    },
                ],
            }),
        });

        const provider = new GoogleModelsProvider();
        const result = await provider.getAvailableModels("key");

        expect(result).toEqual([
            {
                name: "gemini-2.0-flash",
                provider: "google-gemini",
                isFree: true,
            },
        ]);
    });

    it("lança erro quando fetch falha", async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error("network"));

        const provider = new GoogleModelsProvider();
        await expect(provider.getAvailableModels("key")).rejects.toThrow();
    });
});
