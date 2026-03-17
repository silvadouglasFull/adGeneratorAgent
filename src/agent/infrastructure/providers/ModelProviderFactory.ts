import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ModelConfig } from "../../domain/model/ModelConfig";
import { ModelRegistry } from "../../domain/model/ModelRegistry";
import { SupportedModel } from "../../domain/model/SupportedModel";
import { IModelProviderFactory } from "../../domain/service/IModelProviderFactory";

export class ModelProviderFactory implements IModelProviderFactory {
    private static readonly HELICONE_OPENAI_BASE_URL = "https://oai.helicone.ai/v1";
    private static readonly HELICONE_GEMINI_BASE_URL = "https://gateway.helicone.ai";
    private static readonly GEMINI_TARGET_URL = "https://generativelanguage.googleapis.com";

    constructor(
        private readonly registry: ModelRegistry,
        private readonly heliconeApiKey: string | undefined = process.env.HELICONE_API_KEY
    ) { }

    create(model: SupportedModel, userId?: string): BaseChatModel {
        const config = this.registry.get(model);
        const resolvedUserId = userId ?? "anonymous";

        if (config.modelProvider === "openai") {
            return this.createOpenAI(model, config, resolvedUserId);
        }

        return this.createGemini(model, config, resolvedUserId);
    }

    private createOpenAI(model: SupportedModel, config: ModelConfig, userId: string): BaseChatModel {
        if (!this.heliconeApiKey) {
            return new ChatOpenAI({
                model,
                apiKey: config.apiKey,
                temperature: 0.7,
                maxRetries: 0,
            });
        }

        return new ChatOpenAI({
            model,
            apiKey: config.apiKey,
            temperature: 0.7,
            maxRetries: 0,
            configuration: {
                baseURL: ModelProviderFactory.HELICONE_OPENAI_BASE_URL,
                defaultHeaders: {
                    "Helicone-Auth": `Bearer ${this.heliconeApiKey}`,
                    "Helicone-User-Id": userId,
                },
            },
        });
    }

    private createGemini(model: SupportedModel, config: ModelConfig, userId: string): BaseChatModel {
        if (!this.heliconeApiKey) {
            return new ChatGoogleGenerativeAI({
                model,
                apiKey: config.apiKey,
                temperature: 0.7,
                maxRetries: 0,
            });
        }

        return new ChatGoogleGenerativeAI({
            model,
            apiKey: config.apiKey,
            temperature: 0.7,
            maxRetries: 0,
            baseUrl: ModelProviderFactory.HELICONE_GEMINI_BASE_URL,
            customHeaders: {
                "Helicone-Auth": `Bearer ${this.heliconeApiKey}`,
                "Helicone-User-Id": userId,
                "Helicone-Target-URL": ModelProviderFactory.GEMINI_TARGET_URL,
            },
        });
    }
}
