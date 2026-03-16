/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { initChatModel } from "langchain/chat_models/universal";
import { ModelRegistry } from "../model/ModelRegistry";

export class ModelInitializerService {
    constructor(private registry: ModelRegistry) { }

    async initialize(
        modelName: string,
        temperature: number = 0.7,
        maxRetries: number = 0
    ): Promise<BaseLanguageModel> {
        const config = this.registry.get(modelName as any);
        return initChatModel(modelName, {
            modelProvider: config.modelProvider,
            apiKey: config.apiKey,
            temperature,
            maxRetries,
        });
    }
}
