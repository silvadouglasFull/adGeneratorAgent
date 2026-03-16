import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { readFileSync } from "fs";
import { join } from "path";
import { adGeneratorPrompt } from "./prompt";

export const SUPPORTED_MODELS = ["gpt-4o-mini", "gemini-2.0-flash"] as const;
export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

// Exports para testing
export { generateAd_gemini, generateAd_openai, routeToModel };

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
 * Função roteadora que decide qual nó de modelo executar baseado no estado.
 * Implementa roteamento condicional (conditional edges) em vez de if/else dentro do nó.
 */
function routeToModel(state: AgentStateType): string {
    const model = state.model ?? "gpt-4o-mini";
    return model === "gemini-2.0-flash" ? "generateAd_gemini" : "generateAd_openai";
}

/**
 * Nó especializado para gerar anúncio usando ChatOpenAI (gpt-4o-mini).
 * Responsável apenas pela geração com o modelo OpenAI.
 */
async function generateAd_openai(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
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

/**
 * Nó especializado para gerar anúncio usando ChatGoogleGenerativeAI (gemini-2.0-flash).
 * Responsável apenas pela geração com o modelo Google Gemini.
 */
async function generateAd_gemini(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const geminiApiKey = process.env.GENAI_API;
    if (!geminiApiKey) {
        throw new Error("A variável de ambiente GENAI_API é obrigatória para usar o modelo gemini-2.0-flash.");
    }

    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        apiKey: geminiApiKey,
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
    // Nós especializados por modelo (sem if/else dentro do nó)
    .addNode("generateAd_openai", generateAd_openai)
    .addNode("generateAd_gemini", generateAd_gemini)
    .addNode("validateOutput", validateOutput)
    .addEdge(START, "loadInstructions")
    // Roteamento condicional baseado no state.model
    .addConditionalEdges("loadInstructions", routeToModel, {
        generateAd_openai: "generateAd_openai",
        generateAd_gemini: "generateAd_gemini",
    })
    // Ambos os nós de modelo levam para validação
    .addEdge("generateAd_openai", "validateOutput")
    .addEdge("generateAd_gemini", "validateOutput")
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
        // Filtra apenas mensagens dos nós de geração de anúncio (ambos openai e gemini)
        if (metadata?.langgraph_node !== "generateAd_openai" && metadata?.langgraph_node !== "generateAd_gemini") {
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
