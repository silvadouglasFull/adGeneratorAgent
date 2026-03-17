/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { ModelProviderFactory } from "./infrastructure/providers/ModelProviderFactory";
const modelProviderFactory = process.env.HELICONE_API_KEY
    ? new ModelProviderFactory(modelRegistry, process.env.HELICONE_API_KEY)
    : undefined;
const modelInitializerService = new ModelInitializerService(modelRegistry, modelProviderFactory);
const adGenerationService = new AdGenerationService(modelInitializerService, adGeneratorPrompt as any);
const validationService = new OutputValidationService();
const imageIntentDetector = new ImageIntentDetector();
const imagePromptService = new ImagePromptService(modelInitializerService, imageDirectorPrompt as any);
const imageGenerationService = new ImageGenerationService();

const graphBuilder = AdGeneratorGraphBuilder.build(
    instructionService,
    modelInitializerService,
    adGenerationService,
    validationService,
    imageIntentDetector
);

export const adGeneratorAgent = graphBuilder.compile();

const streamGenerator = new AdStreamGenerator(
    adGeneratorAgent,
    MessageParser,
    imageIntentDetector,
    imagePromptService,
    imageGenerationService
);

export async function* streamGeneratedAd({
    input,
    model,
}: {
    input: string;
    model?: SupportedModel;
}): AsyncGenerator<string, StreamResult, void> {
    return yield* streamGenerator.stream({ input, model });
}

export { ModelRegistry, SUPPORTED_MODELS, TEXT_MODELS };
export type { StreamResult, SupportedModel, TextModel, TokenUsage };

