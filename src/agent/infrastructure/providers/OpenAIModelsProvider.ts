import { ModelCatalogProviderException } from "@/agent/domain/exception/ModelCatalogProviderException";
import { ChatModel } from "@/agent/domain/model/ChatModel";
import { IModelsProvider } from "@/agent/domain/service/IModelsProvider";

type OpenAIModelPayload = {
    id?: string;
};

type OpenAIModelsResponse = {
    data?: OpenAIModelPayload[];
};

export class OpenAIModelsProvider implements IModelsProvider {
    readonly provider = "openai" as const;

    async getAvailableModels(apiKey: string): Promise<ChatModel[]> {
        if (!apiKey) {
            return [];
        }

        let response: Response;
        try {
            response = await fetch("https://api.openai.com/v1/models", {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });
        } catch (error) {
            throw new ModelCatalogProviderException("Falha ao consultar modelos da OpenAI", error);
        }

        if (!response.ok) {
            throw new ModelCatalogProviderException(`OpenAI retornou erro HTTP ${response.status}`);
        }

        let payload: OpenAIModelsResponse;
        try {
            payload = (await response.json()) as OpenAIModelsResponse;
        } catch (error) {
            throw new ModelCatalogProviderException("Falha ao parsear resposta da OpenAI", error);
        }

        if (!Array.isArray(payload.data)) {
            return [];
        }

        return payload.data
            .filter((model) => !!model.id)
            .map((model) => model.id ?? "")
            .filter((id) => this.isChatGenerationModel(id))
            .map((id) => ({
                name: id,
                provider: this.provider,
                isFree: false,
            }));
    }

    private isChatGenerationModel(modelName: string): boolean {
        const normalized = modelName.toLowerCase();

        if (normalized.includes("embedding") || normalized.includes("audio") || normalized.includes("tts")) {
            return false;
        }

        return (
            normalized.startsWith("gpt") ||
            normalized.startsWith("o1") ||
            normalized.startsWith("o3") ||
            normalized.includes("chat")
        );
    }
}
