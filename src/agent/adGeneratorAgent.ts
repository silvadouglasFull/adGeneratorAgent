import { AdGeneratorGraphBuilder } from "./application/graph/AdGeneratorGraphBuilder";
import { AdStreamGenerator, TokenUsage } from "./application/stream/AdStreamGenerator";
import { MessageParser } from "./application/stream/MessageParser";
import { ModelRegistry } from "./domain/model/ModelRegistry";
import { SUPPORTED_MODELS, SupportedModel } from "./domain/model/SupportedModel";
import { AdGenerationService } from "./domain/service/AdGenerationService";
import { InstructionService } from "./domain/service/InstructionService";
import { ModelInitializerService } from "./domain/service/ModelInitializerService";
import { OutputValidationService } from "./domain/service/OutputValidationService";
import { adGeneratorPrompt } from "./prompt";

const modelRegistry = ModelRegistry.default();
const instructionService = new InstructionService();
const modelInitializerService = new ModelInitializerService(modelRegistry);
const adGenerationService = new AdGenerationService(modelInitializerService, adGeneratorPrompt as any);
const validationService = new OutputValidationService();

const graphBuilder = AdGeneratorGraphBuilder.build(
    instructionService,
    modelInitializerService,
    adGenerationService,
    validationService
);

export const adGeneratorAgent = graphBuilder.compile();

const streamGenerator = new AdStreamGenerator(adGeneratorAgent, MessageParser);

export async function* streamGeneratedAd({
    input,
    model,
}: {
    input: string;
    model?: SupportedModel;
    // @ts-ignore - Generator return type delegation to inner generator
}): AsyncGenerator<string, { ad: string; usage?: TokenUsage }, void> {
    yield* streamGenerator.stream({ input, model });
}

export { ModelRegistry, SUPPORTED_MODELS };
export type { SupportedModel };

