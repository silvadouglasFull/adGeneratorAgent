import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { SupportedModel } from "../../domain/model/SupportedModel";
import { ILiteLLMProxyProvider } from "../../domain/service/ILiteLLMProxyProvider";
import { ModelProviderOptions } from "../../domain/service/IModelProviderFactory";

export class LiteLLMProxyProvider implements ILiteLLMProxyProvider {
    private static readonly HEALTH_TIMEOUT_MS = 2000;

    constructor(
        private readonly proxyUrl: string,
        private readonly apiKey: string
    ) { }

    create(model: SupportedModel, options?: ModelProviderOptions): BaseChatModel {
        const headers: Record<string, string> = {};

        if (options?.heliconeRequestId) {
            headers["Helicone-Request-Id"] = options.heliconeRequestId;
        }

        return new ChatOpenAI({
            model,
            apiKey: this.apiKey,
            temperature: 0.7,
            maxRetries: 0,
            configuration: {
                baseURL: `${this.proxyUrl}/v1`,
                ...(Object.keys(headers).length > 0 ? { defaultHeaders: headers } : {}),
            },
        });
    }

    async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(
                () => controller.abort(),
                LiteLLMProxyProvider.HEALTH_TIMEOUT_MS
            );

            const response = await fetch(`${this.proxyUrl}/health`, {
                signal: controller.signal,
            });

            clearTimeout(timeout);
            return response.ok;
        } catch {
            return false;
        }
    }
}
