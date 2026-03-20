/* eslint-disable @typescript-eslint/no-explicit-any */
import { END, START, StateGraph } from "@langchain/langgraph";
import { AdGenerationRequest } from "../../domain/model/AdGenerationRequest";
import { AdGenerationService } from "../../domain/service/AdGenerationService";
import { ImageGenerationService } from "../../domain/service/ImageGenerationService";
import { ImageIntentDetector } from "../../domain/service/ImageIntentDetector";
import { ImagePromptService } from "../../domain/service/ImagePromptService";
import { InstructionService } from "../../domain/service/InstructionService";
import { ModelInitializerService } from "../../domain/service/ModelInitializerService";
import { OutputValidationService } from "../../domain/service/OutputValidationService";
import { AgentState, AgentStateType } from "../../infrastructure/state/AgentStateDefinition";

export class AdGeneratorGraphBuilder {
    static build(
        instructionService: InstructionService,
        modelInitializerService: ModelInitializerService,
        adGenerationService: AdGenerationService,
        validationService: OutputValidationService,
        imageIntentDetector?: ImageIntentDetector,
        imagePromptService?: ImagePromptService,
        imageGenerationService?: ImageGenerationService
    ): any {
        const graph = new StateGraph(AgentState);

        graph.addNode("loadInstructions", async (): Promise<Partial<AgentStateType>> => {
            const instructions = await instructionService.load();
            return { instructions };
        });

        graph.addNode("generateAd", async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
            const request = AdGenerationRequest.create(
                state.input,
                state.instructions,
                state.model,
                state.heliconeRequestId
            );
            const ad = await adGenerationService.generate(request);
            return { ad };
        });

        graph.addNode("validateOutput", async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
            const ad = validationService.validate(state.ad);
            return { ad };
        });

        graph.addNode("detectImageIntent", async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
            if (!imageIntentDetector) {
                return { shouldGenerateImage: false };
            }
            const shouldGenerateImage = imageIntentDetector.requiresImage(state.input);
            return { shouldGenerateImage };
        });

        graph.addNode("generateImagePrompt", async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
            if (!imagePromptService) {
                return {};
            }
            const imagePrompt = await imagePromptService.generate(state.input, state.model);
            return { imagePrompt };
        });

        graph.addNode("generateImage", async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
            if (!imageGenerationService || !state.imagePrompt) {
                return {};
            }
            const result = await imageGenerationService.generate(state.imagePrompt);
            return { imageUrl: result.imageUrl };
        });

        // @ts-ignore - LangGraph type system limitation
        graph.addEdge(START, "loadInstructions");
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("loadInstructions", "generateAd");
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("generateAd", "validateOutput");
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("validateOutput", "detectImageIntent");
        // @ts-ignore - LangGraph type system limitation
        graph.addConditionalEdges(
            // @ts-ignore - LangGraph type system limitation
            "detectImageIntent",
            (state: AgentStateType) => state.shouldGenerateImage ? "generateImagePrompt" : "__end__",
            {
                generateImagePrompt: "generateImagePrompt",
                __end__: END,
            }
        );
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("generateImagePrompt", "generateImage");
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("generateImage", END);

        return graph;
    }
}
