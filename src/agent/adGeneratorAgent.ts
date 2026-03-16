import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { readFileSync } from "fs";
import { initChatModel } from "langchain/chat_models/universal";
import { join } from "path";
import { adGeneratorPrompt } from "./prompt";

export const SUPPORTED_MODELS = ["gpt-4o-mini", "gemini-2.0-flash"] as const;
export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

type ModelConfig = {
    modelProvider: "openai" | "google-genai";
    apiKey?: string;
};

// Registro declarativo de modelos: adicionar novo modelo exige apenas uma nova entrada aqui.
export const MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
    "gpt-4o-mini": { modelProvider: "openai" },
    "gemini-2.0-flash": {
        modelProvider: "google-genai",
        apiKey: process.env.GENAI_API,
    },
};

const AgentState = Annotation.Root({
    input: Annotation<string>(),
    model: Annotation<SupportedModel | undefined>(),
    instructions: Annotation<string>(),
    ad: Annotation<string>(),
});

type AgentStateType = typeof AgentState.State;

async function loadInstructions(): Promise<Partial<AgentStateType>> {
    const instructionsPath = join(process.cwd(), "src", "agent", "instructions.md");
    const instructions = readFileSync(instructionsPath, "utf-8");
    return { instructions };
}

/**
 * Nó único de geração que instancia dinamicamente o modelo via initChatModel.
 * O provedor é resolvido por configuração declarativa em MODEL_CONFIGS.
 */
export async function generateAd(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const selectedModel = state.model ?? "gpt-4o-mini";
    const modelConfig = MODEL_CONFIGS[selectedModel];

    if (!modelConfig) {
        throw new Error(
            `Modelo "${selectedModel}" não configurado. Modelos suportados: ${SUPPORTED_MODELS.join(", ")}`
        );
    }

    const model = await initChatModel(selectedModel, {
        modelProvider: modelConfig.modelProvider,
        apiKey: modelConfig.apiKey,
        temperature: 0.7,
        maxRetries: 0,
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
    // Grafo linear com nó único de geração baseado em initChatModel.
    .addNode("generateAd", generateAd)
    .addNode("validateOutput", validateOutput)
    .addEdge(START, "loadInstructions")
    .addEdge("loadInstructions", "generateAd")
    .addEdge("generateAd", "validateOutput")
    .addEdge("validateOutput", END);

export const adGeneratorAgent = graph.compile();

/**
 * Função auxiliar para extrair texto do conteúdo da mensagem.
 * Trata diferentes formatos de resposta dos modelos de IA.
 */
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

export async function* streamGeneratedAd({
    input,
    model,
}: {
    input: string;
    model?: SupportedModel;
}): AsyncGenerator<string, { ad: string }, void> {
    const stream = (await adGeneratorAgent.stream(
        { input, model },
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
