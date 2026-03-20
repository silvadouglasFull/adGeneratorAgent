import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ModelRegistry } from "../model/ModelRegistry";
import { isTextModel, SupportedModel } from "../model/SupportedModel";
import { ILiteLLMProxyProvider } from "./ILiteLLMProxyProvider";
import { IModelProviderFactory, ModelProviderOptions } from "./IModelProviderFactory";

export class ModelInitializerService {
    constructor(
        private registry: ModelRegistry,
        private modelProviderFactory?: IModelProviderFactory,
        private liteLLMProvider?: ILiteLLMProxyProvider
    ) { }

    async initialize(
        modelName: SupportedModel,
        temperature: number = 0.7,
        maxRetries: number = 0,
        options?: ModelProviderOptions
    ): Promise<BaseLanguageModel> {
        if (isTextModel(modelName) && this.liteLLMProvider) {
            const available = await this.liteLLMProvider.isAvailable();
            if (available) {
                return this.liteLLMProvider.create(modelName, options) as unknown as BaseLanguageModel;
            }
        }

        if (this.modelProviderFactory) {
            return this.modelProviderFactory.create(modelName, options) as unknown as BaseLanguageModel;
        }

        const config = this.registry.get(modelName);

        if (config.modelProvider === "openai") {
            return new ChatOpenAI({
                model: modelName,
                apiKey: config.apiKey,
                temperature,
                maxRetries,
            });
        }

        return new ChatGoogleGenerativeAI({
            model: modelName,
            apiKey: config.apiKey,
            temperature,
            maxRetries,
        });
    }
}
