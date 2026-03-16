import { ModelNotFoundException } from "../exception/ModelNotFoundException";
import { ModelConfig } from "./ModelConfig";
import { SupportedModel } from "./SupportedModel";

export class ModelRegistry {
    private configs: Record<SupportedModel, ModelConfig>;

    constructor(configs: Record<SupportedModel, ModelConfig>) {
        this.configs = configs;
    }

    get(modelName: SupportedModel): ModelConfig {
        const config = this.configs[modelName];
        if (!config) {
            throw new ModelNotFoundException(modelName, Object.keys(this.configs));
        }
        return config;
    }

    isSupported(modelName: unknown): modelName is SupportedModel {
        return typeof modelName === "string" && modelName in this.configs;
    }

    static default(): ModelRegistry {
        return new ModelRegistry({
            "gpt-4o-mini": { modelProvider: "openai" },
            "gemini-2.0-flash": {
                modelProvider: "google-genai",
                apiKey: process.env.GENAI_API,
            },
        });
    }
}
