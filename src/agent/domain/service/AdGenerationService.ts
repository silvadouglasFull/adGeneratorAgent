/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { AdGenerationRequest } from "../model/AdGenerationRequest";
import { SupportedModel } from "../model/SupportedModel";
import { ModelProviderOptions } from "./IModelProviderFactory";

export class AdGenerationService {
    constructor(
        private modelInitializer: {
            initialize: (
                model: SupportedModel,
                temp?: number,
                maxRetries?: number,
                options?: ModelProviderOptions
            ) => Promise<BaseLanguageModel>
        },
        private prompt: any
    ) { }

    async generate(request: AdGenerationRequest): Promise<string> {
        const selectedModel = request.model ?? "gpt-4o-mini";
        const model = await this.modelInitializer.initialize(selectedModel, 0.7, 0, {
            heliconeRequestId: request.heliconeRequestId,
        });

        const chain = this.prompt.pipe(model);
        const response = await chain.invoke({
            instructions: request.instructions,
            input: request.input,
        });

        return typeof response.content === "string" ? response.content : String(response.content);
    }
}
