/* eslint-disable @typescript-eslint/no-explicit-any */
import { RunnableConfig } from "@langchain/core/runnables";
import { InvalidAdFormatException } from "../../domain/exception/InvalidAdFormatException";
import { SupportedModel } from "../../domain/model/SupportedModel";
import { ImageGenerationResult, ImageGenerationService } from "../../domain/service/ImageGenerationService";
import { ImageIntentDetector } from "../../domain/service/ImageIntentDetector";
import { ImagePromptService } from "../../domain/service/ImagePromptService";
import { MessageParser } from "./MessageParser";

export type TokenUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
};

export type StreamResult = {
    ad: string;
    usage?: TokenUsage;
    imageUrl?: string;
    imageUsage?: { inputTokens: number; outputTokens: number };
    heliconeRequestId?: string;
};

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        return value;
    }

    return undefined;
}

function extractTokenUsage(messageChunk: unknown): Partial<TokenUsage> | null {
    if (!messageChunk || typeof messageChunk !== "object") {
        return null;
    }

    const chunk = messageChunk as {
        usage_metadata?: Record<string, unknown>;
        usageMetadata?: Record<string, unknown>;
        response_metadata?: {
            tokenUsage?: Record<string, unknown>;
            usage?: Record<string, unknown>;
        };
    };

    const usageMetadata = chunk.usage_metadata ?? chunk.usageMetadata;
    const tokenUsage = chunk.response_metadata?.tokenUsage;
    const providerUsage = chunk.response_metadata?.usage;

    const inputTokens =
        toNumber(usageMetadata?.input_tokens) ??
        toNumber(usageMetadata?.prompt_tokens) ??
        toNumber(tokenUsage?.promptTokens) ??
        toNumber(providerUsage?.input_tokens) ??
        toNumber(providerUsage?.prompt_tokens);

    const outputTokens =
        toNumber(usageMetadata?.output_tokens) ??
        toNumber(usageMetadata?.completion_tokens) ??
        toNumber(tokenUsage?.completionTokens) ??
        toNumber(providerUsage?.output_tokens) ??
        toNumber(providerUsage?.completion_tokens);

    const totalTokens =
        toNumber(usageMetadata?.total_tokens) ??
        toNumber(tokenUsage?.totalTokens) ??
        toNumber(providerUsage?.total_tokens);

    if (
        inputTokens === undefined &&
        outputTokens === undefined &&
        totalTokens === undefined
    ) {
        return null;
    }

    return { inputTokens, outputTokens, totalTokens };
}

export class AdStreamGenerator {
    constructor(
        private graph: any,
        private messageParser: typeof MessageParser,
        private imageIntentDetector?: ImageIntentDetector,
        private imagePromptService?: ImagePromptService,
        private imageGenerationService?: ImageGenerationService
    ) { }

    async *stream({
        input,
        model,
        heliconeRequestId,
    }: {
        input: string;
        model?: SupportedModel;
        heliconeRequestId?: string;
    }): AsyncGenerator<string, StreamResult, void> {
        const streamInput: {
            input: string;
            model?: SupportedModel;
            heliconeRequestId?: string;
        } = { input, model };

        if (heliconeRequestId) {
            streamInput.heliconeRequestId = heliconeRequestId;
        }

        const stream = (await this.graph.stream(
            streamInput,
            { streamMode: "messages" } as RunnableConfig
        )) as AsyncIterable<[unknown, { langgraph_node?: string }]>;

        let fullAd = "";
        let usage: Partial<TokenUsage> = {};
        const resolvedHeliconeRequestId: string | undefined = heliconeRequestId;

        for await (const [messageChunk, metadata] of stream) {
            if (metadata?.langgraph_node !== "generateAd") {
                continue;
            }

            const chunkUsage = extractTokenUsage(messageChunk);
            if (chunkUsage) {
                usage = { ...usage, ...chunkUsage };
            }

            const token = this.messageParser.parse(
                messageChunk && typeof messageChunk === "object" && "content" in messageChunk
                    ? (messageChunk as { content?: unknown }).content
                    : ""
            );

            if (!token) {
                continue;
            }

            fullAd += token;
            yield token;
        }

        const trimmedAd = fullAd.trim();
        if (!trimmedAd.startsWith("#")) {
            throw new InvalidAdFormatException();
        }

        const hasUsage =
            usage.inputTokens !== undefined ||
            usage.outputTokens !== undefined ||
            usage.totalTokens !== undefined;

        const finalUsage = hasUsage
            ? {
                inputTokens: usage.inputTokens ?? 0,
                outputTokens: usage.outputTokens ?? 0,
                totalTokens: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            }
            : undefined;

        let imageResult: ImageGenerationResult | undefined;

        if (this.imageIntentDetector?.detect(input) && this.imagePromptService && this.imageGenerationService) {
            const imagePrompt = await this.imagePromptService.generate(input, model);
            imageResult = await this.imageGenerationService.generate(imagePrompt);
        }

        return {
            ad: trimmedAd,
            usage: finalUsage,
            imageUrl: imageResult?.imageUrl,
            imageUsage: imageResult?.usage,
            heliconeRequestId: resolvedHeliconeRequestId,
        };
    }
}
