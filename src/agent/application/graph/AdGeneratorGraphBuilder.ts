import { END, START, StateGraph } from "@langchain/langgraph";
import { AdGenerationRequest } from "../../domain/model/AdGenerationRequest";
import { AdGenerationService } from "../../domain/service/AdGenerationService";
import { InstructionService } from "../../domain/service/InstructionService";
import { ModelInitializerService } from "../../domain/service/ModelInitializerService";
import { OutputValidationService } from "../../domain/service/OutputValidationService";
import { AgentState, AgentStateType } from "../../infrastructure/state/AgentStateDefinition";

export class AdGeneratorGraphBuilder {
    static build(
        instructionService: InstructionService,
        modelInitializerService: ModelInitializerService,
        adGenerationService: AdGenerationService,
        validationService: OutputValidationService
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
                state.model
            );
            const ad = await adGenerationService.generate(request);
            return { ad };
        });

        graph.addNode("validateOutput", async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
            const ad = validationService.validate(state.ad);
            return { ad };
        });

        // @ts-ignore - LangGraph type system limitation
        graph.addEdge(START, "loadInstructions");
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("loadInstructions", "generateAd");
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("generateAd", "validateOutput");
        // @ts-ignore - LangGraph type system limitation
        graph.addEdge("validateOutput", END);

        return graph;
    }
}
