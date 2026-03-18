import { Annotation } from "@langchain/langgraph";
import { SupportedModel } from "../../domain/model/SupportedModel";

export const AgentState = Annotation.Root({
    input: Annotation<string>(),
    model: Annotation<SupportedModel | undefined>(),
    heliconeRequestId: Annotation<string | undefined>(),
    instructions: Annotation<string>(),
    ad: Annotation<string>(),
    shouldGenerateImage: Annotation<boolean | undefined>(),
    imagePrompt: Annotation<string | undefined>(),
    imageUrl: Annotation<string | undefined>(),
});

export type AgentStateType = typeof AgentState.State;
