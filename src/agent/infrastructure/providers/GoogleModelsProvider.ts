import { ModelCatalogProviderException } from "@/agent/domain/exception/ModelCatalogProviderException";
import { ChatModel } from "@/agent/domain/model/ChatModel";
import { IModelsProvider } from "@/agent/domain/service/IModelsProvider";

type GoogleModelPayload = {
    name?: string;
    supportedGenerationMethods?: string[];
};

type GoogleModelsResponse = {
    models?: GoogleModelPayload[];
};

export class GoogleModelsProvider implements IModelsProvider {
    readonly provider = "google-gemini" as const;

    async getAvailableModels(apiKey: string): Promise<ChatModel[]> {
        if (!apiKey) {
            return [];
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;

        let response: Response;
        try {
            response = await fetch(endpoint);
        } catch (error) {
            throw new ModelCatalogProviderException("Falha ao consultar modelos do Google Gemini", error);
        }

        if (!response.ok) {
            throw new ModelCatalogProviderException(
                `Google Gemini retornou erro HTTP ${response.status}`
            );
        }

        let payload: GoogleModelsResponse;
        try {
            payload = (await response.json()) as GoogleModelsResponse;
        } catch (error) {
            throw new ModelCatalogProviderException("Falha ao parsear resposta do Google Gemini", error);
        }

        if (!Array.isArray(payload.models)) {
            return [];
        }

        return payload.models
            .filter((model) => !!model.name)
            .filter((model) => this.supportsGeneration(model.supportedGenerationMethods ?? []))
            .filter((model) => !this.isTaskSpecificModel(model.name ?? ""))
            .map((model) => ({
                name: this.normalizeGoogleName(model.name ?? ""),
                provider: this.provider,
                isFree: true,
            }))
            .filter((model) => model.name.length > 0);
    }

    private supportsGeneration(methods: string[]): boolean {
        return methods.includes("generateContent") || methods.includes("bidiGenerateContent");
    }

    private isTaskSpecificModel(name: string): boolean {
        const normalized = name.toLowerCase();
        return normalized.includes("embedding") || normalized.includes("aqa");
    }

    private normalizeGoogleName(name: string): string {
        return name.replace(/^models\//, "");
    }
}
