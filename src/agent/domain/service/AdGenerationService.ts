/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { AdGenerationRequest } from "../model/AdGenerationRequest";

export class AdGenerationService {
    constructor(
        private modelInitializer: { initialize: (model: string, temp?: number, maxRetries?: number) => Promise<BaseLanguageModel> },
        private prompt: any
    ) { }

    async generate(request: AdGenerationRequest): Promise<string> {
        const selectedModel = request.model ?? "gpt-4o-mini";
        const model = await this.modelInitializer.initialize(selectedModel, 0.7, 0);

        const chain = this.prompt.pipe(model);
        const response = await chain.invoke({
            instructions: request.instructions,
            input: request.input,
        });

        return typeof response.content === "string" ? response.content : String(response.content);
    }
}
