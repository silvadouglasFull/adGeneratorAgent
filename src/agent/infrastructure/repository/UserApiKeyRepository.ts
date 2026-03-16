import { IApiKeyRepository } from "@/agent/domain/service/IApiKeyRepository";
import { ModelProviderName } from "@/agent/domain/service/IModelsProvider";

type UserProviderKeyMap = Record<string, Partial<Record<ModelProviderName, string>>>;

export class UserApiKeyRepository implements IApiKeyRepository {
    constructor(private readonly userKeys: UserProviderKeyMap = {}) { }

    async getApiKey(userId: string, provider: ModelProviderName): Promise<string | null> {
        const fromUserMap = this.userKeys[userId]?.[provider];
        if (fromUserMap && fromUserMap.trim().length > 0) {
            return fromUserMap.trim();
        }

        const fromEnv = this.getApiKeyFromEnv(provider);
        return fromEnv;
    }

    private getApiKeyFromEnv(provider: ModelProviderName): string | null {
        if (provider === "openai") {
            return process.env.OPENAI_API_KEY?.trim() || null;
        }

        return process.env.GENAI_API?.trim() || null;
    }
}
