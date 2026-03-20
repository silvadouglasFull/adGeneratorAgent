jest.mock("@langchain/openai", () => ({
    ChatOpenAI: jest.fn().mockImplementation((config) => ({ ...config, _type: "ChatOpenAI" })),
}));

import { LiteLLMProxyProvider } from "@/agent/infrastructure/providers/LiteLLMProxyProvider";
import { ChatOpenAI } from "@langchain/openai";

describe("LiteLLMProxyProvider", () => {
    const PROXY_URL = "http://localhost:4000";
    const API_KEY = "sk-litellm-test-key";
    let provider: LiteLLMProxyProvider;
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        provider = new LiteLLMProxyProvider(PROXY_URL, API_KEY);
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe("create", () => {
        it("deve retornar ChatOpenAI com baseURL apontando para o proxy", () => {
            provider.create("gpt-4o-mini");

            expect(ChatOpenAI).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "gpt-4o-mini",
                    apiKey: API_KEY,
                    temperature: 0.7,
                    maxRetries: 0,
                    configuration: expect.objectContaining({
                        baseURL: `${PROXY_URL}/v1`,
                    }),
                })
            );
        });

        it("deve passar o modelo correto para o ChatOpenAI", () => {
            provider.create("gemini-2.0-flash");

            expect(ChatOpenAI).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "gemini-2.0-flash",
                })
            );
        });

        it("deve incluir header Helicone-Request-Id quando fornecido", () => {
            provider.create("gpt-4o-mini", { heliconeRequestId: "hel-123" });

            expect(ChatOpenAI).toHaveBeenCalledWith(
                expect.objectContaining({
                    configuration: expect.objectContaining({
                        baseURL: `${PROXY_URL}/v1`,
                        defaultHeaders: expect.objectContaining({
                            "Helicone-Request-Id": "hel-123",
                        }),
                    }),
                })
            );
        });
    });

    describe("isAvailable", () => {
        it("deve retornar true quando health endpoint responde 200", async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

            const result = await provider.isAvailable();

            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                `${PROXY_URL}/health`,
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });

        it("deve retornar false quando health endpoint retorna erro", async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

            const result = await provider.isAvailable();

            expect(result).toBe(false);
        });

        it("deve retornar false quando fetch lança erro de rede", async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error("ECONNREFUSED"));

            const result = await provider.isAvailable();

            expect(result).toBe(false);
        });
    });
});
