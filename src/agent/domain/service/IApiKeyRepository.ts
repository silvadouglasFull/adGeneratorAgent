import { ModelProviderName } from "./IModelsProvider";

export interface IApiKeyRepository {
    getApiKey(userId: string, provider: ModelProviderName): Promise<string | null>;
}
