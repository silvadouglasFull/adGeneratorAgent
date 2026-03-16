/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { SupportedModel } from "../model/SupportedModel";

export class ImagePromptService {
    constructor(
        private modelInitializer: { initialize: (model: SupportedModel, temp?: number, maxRetries?: number) => Promise<BaseLanguageModel> },
        private prompt: any
    ) { }

    async generate(input: string, model?: SupportedModel): Promise<string> {
        const selectedModel = model ?? "gpt-4o-mini";
        const llm = await this.modelInitializer.initialize(selectedModel, 0.7, 0);

        const chain = this.prompt.pipe(llm);
        const response = await chain.invoke({ input });

        const content = typeof response.content === "string" ? response.content : String(response.content);
        return content.trim();
    }
}
