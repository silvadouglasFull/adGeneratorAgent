import { modelCatalogService } from "@/agent/modelCatalogService";

type ModelResponse = {
    name: string;
    displayName: string;
    provider: string;
    isFree: boolean;
};

function toDisplayName(name: string): string {
    const displayNames: Record<string, string> = {
        "gpt-4o-mini": "GPT-4o Mini",
        "gemini-2.0-flash": "Gemini 2.0 Flash",
    };

    return displayNames[name] ?? name;
}

export async function GET() {
    try {
        const chatModels = await modelCatalogService.getAvailableModels("default");

        const models: ModelResponse[] = chatModels.map((m) => ({
            name: m.name,
            displayName: toDisplayName(m.name),
            provider: m.provider,
            isFree: m.isFree,
        }));

        return Response.json({ models });
    } catch (error) {
        console.error("Falha ao carregar modelos disponíveis", error);

        return Response.json(
            { error: "Não foi possível carregar os modelos disponíveis." },
            { status: 500 }
        );
    }
}
