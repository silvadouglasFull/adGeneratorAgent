import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { readFileSync } from "fs";
import { join } from "path";
import { adGeneratorPrompt } from "./prompt";

const AgentState = Annotation.Root({
    input: Annotation<string>(),
    instructions: Annotation<string>(),
    ad: Annotation<string>(),
});

type AgentStateType = typeof AgentState.State;

async function loadInstructions(): Promise<Partial<AgentStateType>> {
    const instructionsPath = join(process.cwd(), "src", "agent", "instructions.md");
    const instructions = readFileSync(instructionsPath, "utf-8");
    return { instructions };
}

async function generateAd(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.7,
    });

    const chain = adGeneratorPrompt.pipe(model);
    const response = await chain.invoke({
        instructions: state.instructions,
        input: state.input,
    });

    const ad = typeof response.content === "string" ? response.content : String(response.content);
    return { ad };
}

async function validateOutput(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const { ad } = state;
    if (!ad || !ad.trimStart().startsWith("#")) {
        throw new Error("Output inválido: o anúncio gerado não está em formato Markdown válido.");
    }
    return { ad: ad.trim() };
}

const graph = new StateGraph(AgentState)
    .addNode("loadInstructions", loadInstructions)
    .addNode("generateAd", generateAd)
    .addNode("validateOutput", validateOutput)
    .addEdge(START, "loadInstructions")
    .addEdge("loadInstructions", "generateAd")
    .addEdge("generateAd", "validateOutput")
    .addEdge("validateOutput", END);

export const adGeneratorAgent = graph.compile();

function contentToText(content: unknown): string {
    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === "string") {
                    return part;
                }

                if (
                    part &&
                    typeof part === "object" &&
                    "text" in part &&
                    typeof (part as { text?: unknown }).text === "string"
                ) {
                    return (part as { text: string }).text;
                }

                return "";
            })
            .join("");
    }

    return "";
}

export async function* streamGeneratedAd(input: string): AsyncGenerator<string, { ad: string }, void> {
    const stream = (await adGeneratorAgent.stream(
        { input },
        { streamMode: "messages" }
    )) as AsyncIterable<[unknown, { langgraph_node?: string }]>;

    let fullAd = "";

    for await (const [messageChunk, metadata] of stream) {
        if (metadata?.langgraph_node !== "generateAd") {
            continue;
        }

        const token = contentToText(
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
        throw new Error("Output inválido: o anúncio gerado não está em formato Markdown válido.");
    }

    return { ad: trimmedAd };
}
