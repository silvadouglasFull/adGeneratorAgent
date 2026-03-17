import { streamGeneratedAd, TEXT_MODELS, type SupportedModel } from "@/agent/adGeneratorAgent";
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
            (TEXT_MODELS as readonly string[]).includes(requestedModel)
            ? (requestedModel as SupportedModel)
            : "gpt-4o-mini";

    if (
        typeof requestedModel === "string" &&
        !(TEXT_MODELS as readonly string[]).includes(requestedModel)
    ) {
        return Response.json(
            {
                error: `Modelo inválido. Modelos suportados: ${TEXT_MODELS.join(", ")}.`,
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

                let streamStep = await adStream.next();

                while (!streamStep.done) {
                    const token = streamStep.value;
                    fullOutput += token;

                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: "token", content: token })}\n\n`
                        )
                    );

                    streamStep = await adStream.next();
                }

                const generationResult = streamStep.value;

                if (generationResult?.imageUrl) {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "image",
                                imageUrl: generationResult.imageUrl,
                            })}\n\n`
                        )
                    );
                }

                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "done",
                            metadata: {
                                model,
                                generatedAt,
                                usage: generationResult?.usage ?? null,
                                ...(generationResult?.imageUrl
                                    ? {
                                        imageModel: "gpt-image-1.5",
                                        imageUsage: generationResult.imageUsage ?? null,
                                    }
                                    : {}),
                            },
                        })}\n\n`
                    )
                );

                const requestId = crypto.randomUUID();

                const inputTokens =
                    generationResult?.usage?.inputTokens ?? estimateTokenCount(input.trim());
                const outputTokens =
                    generationResult?.usage?.outputTokens ?? estimateTokenCount(fullOutput);

                const tokenEvent = TokenConsumptionEvent.create({
                    requestId,
                    modelUsed: model,
                    inputTokens,
                    outputTokens,
                    timestamp: new Date(),
                    heliconeRequestId: generationResult?.heliconeRequestId,
                });

                tokenConsumptionContainer.useCase.execute(tokenEvent).catch((error) => {
                    console.error("Falha ao registrar consumo de tokens", error);
                });

                if (generationResult?.imageUsage) {
                    const imageTokenEvent = TokenConsumptionEvent.create({
                        requestId: crypto.randomUUID(),
                        modelUsed: "gpt-image-1.5",
                        inputTokens: generationResult.imageUsage.inputTokens,
                        outputTokens: generationResult.imageUsage.outputTokens,
                        timestamp: new Date(),
                    });

                    tokenConsumptionContainer.useCase.execute(imageTokenEvent).catch((error) => {
                        console.error("Falha ao registrar consumo de tokens de imagem", error);
                    });
                }
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
