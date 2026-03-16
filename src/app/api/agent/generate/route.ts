import { streamGeneratedAd } from "@/agent/adGeneratorAgent";

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

    const encoder = new TextEncoder();
    const model = "gpt-4o-mini";
    const generatedAt = new Date().toISOString();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const adStream = streamGeneratedAd(input.trim());

                for await (const token of adStream) {
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
