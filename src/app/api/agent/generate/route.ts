import { SUPPORTED_MODELS, type SupportedModel, streamGeneratedAd } from "@/agent/adGeneratorAgent";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
import {
    ensureTokenConsumptionConsumerStarted,
    tokenConsumptionContainer,
} from "@/tokenConsumption/tokenConsumption";

function estimateTokenCount(text: string): number {
    const normalized = text.trim();

    if (!normalized) {
        return 1;
    }

    const words = normalized.split(/\s+/).length;
    return Math.max(1, Math.ceil(words * 1.3));
}

export async function POST(request: Request) {
    let body: Record<string, unknown>;

    try {
        body = await request.json();
    } catch {
        return Response.json(
            { error: "Body inválido. Envie um JSON com o campo 'input'." },
            { status: 400 }
        );
    }

    const input = body?.input;

    if (!input || typeof input !== "string" || input.trim() === "") {
        return Response.json(
            { error: "O campo 'input' é obrigatório e não pode estar vazio." },
            { status: 400 }
        );
    }

    const requestedModel = body?.model;
    const model: SupportedModel =
        typeof requestedModel === "string" &&
            (SUPPORTED_MODELS as readonly string[]).includes(requestedModel)
            ? (requestedModel as SupportedModel)
            : "gpt-4o-mini";

    if (
        typeof requestedModel === "string" &&
        !(SUPPORTED_MODELS as readonly string[]).includes(requestedModel)
    ) {
        return Response.json(
            {
                error: `Modelo inválido. Modelos suportados: ${SUPPORTED_MODELS.join(", ")}.`,
            },
            { status: 400 }
        );
    }

    const encoder = new TextEncoder();
    const generatedAt = new Date().toISOString();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                await ensureTokenConsumptionConsumerStarted();

                const adStream = streamGeneratedAd({
                    input: input.trim(),
                    model,
                });

                let fullOutput = "";

                for await (const token of adStream) {
                    fullOutput += token;

                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: "token", content: token })}\n\n`
                        )
                    );
                }

                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "done",
                            metadata: { model, generatedAt },
                        })}\n\n`
                    )
                );

                const inputTokens = estimateTokenCount(input.trim());
                const outputTokens = estimateTokenCount(fullOutput);

                const tokenEvent = TokenConsumptionEvent.create({
                    requestId: crypto.randomUUID(),
                    modelUsed: model,
                    inputTokens,
                    outputTokens,
                    timestamp: new Date(),
                });

                tokenConsumptionContainer.useCase.execute(tokenEvent).catch((error) => {
                    console.error("Falha ao registrar consumo de tokens", error);
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Erro interno ao gerar o anúncio.";

                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({ type: "error", error: message })}\n\n`
                    )
                );
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
