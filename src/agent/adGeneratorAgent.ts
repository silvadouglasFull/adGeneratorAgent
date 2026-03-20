/* eslint-disable @typescript-eslint/no-explicit-any */
import { PromptType } from "@/prompts/domain/enum/PromptType";
import { promptsContainer } from "@/prompts/promptsContainer";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AdGeneratorGraphBuilder } from "./application/graph/AdGeneratorGraphBuilder";
import { AdStreamGenerator, StreamResult, TokenUsage } from "./application/stream/AdStreamGenerator";
import { MessageParser } from "./application/stream/MessageParser";
import { ModelRegistry } from "./domain/model/ModelRegistry";
import { SUPPORTED_MODELS, SupportedModel, TEXT_MODELS, TextModel } from "./domain/model/SupportedModel";
import { AdGenerationService } from "./domain/service/AdGenerationService";
import { ImageGenerationService } from "./domain/service/ImageGenerationService";
import { ImageIntentDetector } from "./domain/service/ImageIntentDetector";
import { ImagePromptService } from "./domain/service/ImagePromptService";
import { InstructionService } from "./domain/service/InstructionService";
import { ModelInitializerService } from "./domain/service/ModelInitializerService";
import { OutputValidationService } from "./domain/service/OutputValidationService";
import { imageDirectorPrompt } from "./imagePrompt";
import { adGeneratorPrompt } from "./prompt";

const modelRegistry = ModelRegistry.default();
const instructionService = new InstructionService();

import { LiteLLMProxyProvider } from "./infrastructure/providers/LiteLLMProxyProvider";
import { ModelProviderFactory } from "./infrastructure/providers/ModelProviderFactory";
const modelProviderFactory = process.env.HELICONE_API_KEY
    ? new ModelProviderFactory(modelRegistry, process.env.HELICONE_API_KEY)
    : undefined;
const liteLLMProvider = process.env.LITELLM_PROXY_URL && process.env.LITELLM_API_KEY
    ? new LiteLLMProxyProvider(process.env.LITELLM_PROXY_URL, process.env.LITELLM_API_KEY)
    : undefined;
const modelInitializerService = new ModelInitializerService(modelRegistry, modelProviderFactory, liteLLMProvider);
const validationService = new OutputValidationService();
const imageIntentDetector = new ImageIntentDetector();
const imageGenerationService = new ImageGenerationService();

const defaultAdGenerationService = new AdGenerationService(modelInitializerService, adGeneratorPrompt as any);
const graphBuilder = AdGeneratorGraphBuilder.build(
    instructionService,
    modelInitializerService,
    defaultAdGenerationService,
    validationService,
    imageIntentDetector
);

export const adGeneratorAgent = graphBuilder.compile();

function buildTextPromptTemplate(promptContent: string) {
    return ChatPromptTemplate.fromMessages([
        ["system", `${promptContent}\n\n{instructions}`],
        ["human", "Gere um anúncio para o seguinte produto/serviço:\n\n{input}"],
    ]);
}

function buildImagePromptTemplate(promptContent: string) {
    return ChatPromptTemplate.fromMessages([
        ["system", promptContent],
        ["human", "Gere um prompt de imagem publicitária para:\n\n{input}"],
    ]);
}

export async function* streamGeneratedAd({
    input,
    model,
    sessionUserId,
    heliconeRequestId,
}: {
    input: string;
    model?: SupportedModel;
    sessionUserId: string;
    heliconeRequestId?: string;
}): AsyncGenerator<string, StreamResult, void> {
    let resolvedAdPrompt = adGeneratorPrompt;
    let resolvedImagePrompt = imageDirectorPrompt;

    if (!sessionUserId) {
        throw new Error("Usuário não autenticado para geração do anúncio.");
    }

    if (imageIntentDetector.requiresText(input)) {
        const textPrompt = await promptsContainer.promptFetchService.fetchActivePrompt(
            sessionUserId,
            PromptType.TEXT_GENERATION
        );
        resolvedAdPrompt = buildTextPromptTemplate(textPrompt) as any;
    }

    if (imageIntentDetector.requiresImage(input)) {
        const imagePrompt = await promptsContainer.promptFetchService.fetchActivePrompt(
            sessionUserId,
            PromptType.IMAGE_GENERATION
        );
        resolvedImagePrompt = buildImagePromptTemplate(imagePrompt) as any;
    }

    const adGenerationService = new AdGenerationService(modelInitializerService, resolvedAdPrompt as any);
    const imagePromptService = new ImagePromptService(modelInitializerService, resolvedImagePrompt as any);

    const currentGraphBuilder = AdGeneratorGraphBuilder.build(
        instructionService,
        modelInitializerService,
        adGenerationService,
        validationService,
        imageIntentDetector
    );

    const currentAgent = currentGraphBuilder.compile();
    const streamGenerator = new AdStreamGenerator(
        currentAgent,
        MessageParser,
        imageIntentDetector,
        imagePromptService,
        imageGenerationService
    );

    return yield* streamGenerator.stream({ input, model, heliconeRequestId });
}

export { ModelRegistry, SUPPORTED_MODELS, TEXT_MODELS };
export type { StreamResult, SupportedModel, TextModel, TokenUsage };

