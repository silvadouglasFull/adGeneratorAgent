import { ModelCatalogService } from "@/agent/application/service/ModelCatalogService";
import { ChatModel } from "@/agent/domain/model/ChatModel";
import { IApiKeyRepository } from "@/agent/domain/service/IApiKeyRepository";
import { IModelsProvider } from "@/agent/domain/service/IModelsProvider";

function createProvider(provider: IModelsProvider["provider"], models: ChatModel[], shouldFail = false): IModelsProvider {
    return {
        provider,
        getAvailableModels: jest.fn(async () => {
            if (shouldFail) {
                throw new Error(`${provider} down`);
            }
            return models;
        }),
    };
}

describe("ModelCatalogService", () => {
    it("retorna [] quando usuário não possui chave para nenhum provider", async () => {
        const repo: IApiKeyRepository = {
            getApiKey: jest.fn().mockResolvedValue(null),
        };

        const service = new ModelCatalogService(
            [createProvider("openai", []), createProvider("google-gemini", [])],
            repo,
            { defaultModels: [] }
        );

        const result = await service.getAvailableModels("user-1");

        expect(result).toEqual([]);
    });

    it("mescla modelos de OpenAI e Google com deduplicação por name", async () => {
        const repo: IApiKeyRepository = {
            getApiKey: jest
                .fn()
                .mockImplementation(async (_userId: string, provider: string) =>
                    provider === "openai" ? "openai-key" : "gemini-key"
                ),
        };

        const service = new ModelCatalogService(
            [
                createProvider("openai", [
                    { name: "gpt-4o-mini", provider: "openai", isFree: false },
                    { name: "gpt-4.1-mini", provider: "openai", isFree: false },
                ]),
                createProvider("google-gemini", [
                    { name: "gemini-2.0-flash", provider: "google-gemini", isFree: true },
                    { name: "gpt-4o-mini", provider: "google-gemini", isFree: true },
                ]),
            ],
            repo,
            { defaultModels: [] }
        );

        const result = await service.getAvailableModels("user-1");
        const names = result.map((model) => model.name);

        expect(names).toContain("gpt-4o-mini");
        expect(names).toContain("gpt-4.1-mini");
        expect(names).toContain("gemini-2.0-flash");
        expect(names.filter((name) => name === "gpt-4o-mini")).toHaveLength(1);
    });

    it("mantém retorno parcial quando um provider falha", async () => {
        const repo: IApiKeyRepository = {
            getApiKey: jest
                .fn()
                .mockImplementation(async (_userId: string, provider: string) =>
                    provider === "openai" ? "openai-key" : "gemini-key"
                ),
        };

        const service = new ModelCatalogService(
            [
                createProvider("openai", [{ name: "gpt-4o-mini", provider: "openai", isFree: false }]),
                createProvider("google-gemini", [], true),
            ],
            repo,
            { defaultModels: [] }
        );

        const result = await service.getAvailableModels("user-1");

        expect(result).toEqual([{ name: "gpt-4o-mini", provider: "openai", isFree: false }]);
    });

    it("retorna [] quando todos providers falham", async () => {
        const repo: IApiKeyRepository = {
            getApiKey: jest
                .fn()
                .mockImplementation(async (_userId: string, provider: string) =>
                    provider === "openai" ? "openai-key" : "gemini-key"
                ),
        };

        const service = new ModelCatalogService(
            [createProvider("openai", [], true), createProvider("google-gemini", [], true)],
            repo,
            { defaultModels: [] }
        );

        const result = await service.getAvailableModels("user-1");

        expect(result).toEqual([]);
    });

    it("append de modelos default quando aplicável", async () => {
        const repo: IApiKeyRepository = {
            getApiKey: jest.fn().mockResolvedValue("openai-key"),
        };

        const service = new ModelCatalogService(
            [createProvider("openai", [{ name: "gpt-4.1-mini", provider: "openai", isFree: false }])],
            repo,
            {
                defaultModels: [
                    { name: "gpt-4o-mini", provider: "openai", isFree: false, isDefault: true },
                ],
            }
        );

        const result = await service.getAvailableModels("user-1");
        expect(result.map((model) => model.name)).toContain("gpt-4o-mini");
    });

    it("getFreeModels filtra corretamente", async () => {
        const repo: IApiKeyRepository = {
            getApiKey: jest.fn().mockResolvedValue("key"),
        };

        const service = new ModelCatalogService(
            [
                createProvider("openai", [
                    { name: "gpt-4o-mini", provider: "openai", isFree: false },
                    { name: "gemini-2.0-flash", provider: "google-gemini", isFree: true },
                ]),
            ],
            repo,
            { defaultModels: [] }
        );

        const result = await service.getFreeModels("user-1");
        expect(result).toEqual([{ name: "gemini-2.0-flash", provider: "google-gemini", isFree: true }]);
    });

    it("getModelInfo encontra por nome", async () => {
        const repo: IApiKeyRepository = {
            getApiKey: jest.fn().mockResolvedValue("key"),
        };

        const service = new ModelCatalogService(
            [
                createProvider("openai", [
                    { name: "gpt-4o-mini", provider: "openai", isFree: false },
                ]),
            ],
            repo,
            { defaultModels: [] }
        );

        const result = await service.getModelInfo("gpt-4o-mini", "user-1");
        expect(result?.name).toBe("gpt-4o-mini");
    });
});
