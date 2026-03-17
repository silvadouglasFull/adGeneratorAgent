import { ChatModel } from "@/agent/domain/model/ChatModel";
import { SUPPORTED_MODELS } from "@/agent/domain/model/SupportedModel";
import { IApiKeyRepository } from "@/agent/domain/service/IApiKeyRepository";
import { IModelCatalogService } from "@/agent/domain/service/IModelCatalogService";
import { IModelsProvider } from "@/agent/domain/service/IModelsProvider";

type ModelCatalogConfig = {
    defaultModels?: ChatModel[];
};

export class ModelCatalogService implements IModelCatalogService {
    private readonly defaultModels: ChatModel[];

    constructor(
        private readonly providers: IModelsProvider[],
        private readonly apiKeyRepository: IApiKeyRepository,
        config?: ModelCatalogConfig
    ) {
        this.defaultModels = config?.defaultModels ?? [
            { name: SUPPORTED_MODELS[0], provider: "openai", isFree: false, isDefault: true },
            { name: SUPPORTED_MODELS[1], provider: "google-gemini", isFree: true, isDefault: true },
        ];
    }

    async getAvailableModels(userId: string): Promise<ChatModel[]> {
        const providerResults: ChatModel[][] = [];
        let hasAnyKey = false;

        for (const provider of this.providers) {
            const apiKey = await this.apiKeyRepository.getApiKey(userId, provider.provider);
            if (!apiKey) {
                continue;
            }

            hasAnyKey = true;

            try {
                const models = await provider.getAvailableModels(apiKey);
                providerResults.push(models);
            } catch (error) {
                console.error(`Falha ao consultar provider ${provider.provider}`, error);
            }
        }

        if (!hasAnyKey) {
            return [];
        }

        const merged = this.deduplicateByName(providerResults.flat());
        const withDefaults = this.deduplicateByName([...merged, ...this.defaultModels]);

        return withDefaults;
    }

    async getFreeModels(userId: string): Promise<ChatModel[]> {
        const models = await this.getAvailableModels(userId);
        return models.filter((model) => model.isFree);
    }

    async getModelInfo(modelName: string, userId: string): Promise<ChatModel | undefined> {
        const models = await this.getAvailableModels(userId);
        return models.find((model) => model.name === modelName);
    }

    private deduplicateByName(models: ChatModel[]): ChatModel[] {
        const map = new Map<string, ChatModel>();

        for (const model of models) {
            if (!map.has(model.name)) {
                map.set(model.name, model);
            }
        }

        return Array.from(map.values());
    }
}
