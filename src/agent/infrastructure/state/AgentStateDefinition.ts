import { Annotation } from "@langchain/langgraph";
import { SupportedModel } from "../../domain/model/SupportedModel";

export const AgentState = Annotation.Root({
    input: Annotation<string>(),
    model: Annotation<SupportedModel | undefined>(),
    instructions: Annotation<string>(),
    ad: Annotation<string>(),
});

export type AgentStateType = typeof AgentState.State;
