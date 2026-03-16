import { AdStreamGenerator } from "../../application/stream/AdStreamGenerator";
import { MessageParser } from "../../application/stream/MessageParser";
import { InvalidAdFormatException } from "../../domain/exception/InvalidAdFormatException";

type GraphEvent = [unknown, { langgraph_node?: string }];

function createAsyncIterable(events: GraphEvent[]): AsyncIterable<GraphEvent> {
    return {
        async *[Symbol.asyncIterator]() {
            for (const event of events) {
                yield event;
            }
        },
    };
}

describe("AdStreamGenerator", () => {
    it("deve emitir tokens do nó generateAd e retornar anúncio final", async () => {
        const graph = {
            stream: jest.fn().mockResolvedValue(
                createAsyncIterable([
                    [{ content: "ignorado" }, { langgraph_node: "loadInstructions" }],
                    [{ content: "# Título" }, { langgraph_node: "generateAd" }],
                    [{ content: "\n\nDescrição" }, { langgraph_node: "generateAd" }],
                ])
            ),
        };

        const generator = new AdStreamGenerator(graph, MessageParser);
        const stream = generator.stream({ input: "Produto X", model: "gpt-4o-mini" });

        const emittedTokens: string[] = [];
        let finalResult: { ad: string; usage?: { inputTokens: number; outputTokens: number; totalTokens: number } } | undefined;

        for (; ;) {
            const step = await stream.next();
            if (step.done) {
                finalResult = step.value;
                break;
            }
            emittedTokens.push(step.value);
        }

        expect(emittedTokens).toEqual(["# Título", "\n\nDescrição"]);
        expect(finalResult).toEqual({ ad: "# Título\n\nDescrição" });
        expect(graph.stream).toHaveBeenCalledWith(
            { input: "Produto X", model: "gpt-4o-mini" },
            { streamMode: "messages" }
        );
    });

    it("deve retornar usage quando metadados de token estiverem presentes", async () => {
        const graph = {
            stream: jest.fn().mockResolvedValue(
                createAsyncIterable([
                    [
                        {
                            content: "# Oferta",
                            usage_metadata: {
                                input_tokens: 10,
                                output_tokens: 20,
                                total_tokens: 30,
                            },
                        },
                        { langgraph_node: "generateAd" },
                    ],
                ])
            ),
        };

        const generator = new AdStreamGenerator(graph, MessageParser);
        const stream = generator.stream({ input: "Produto Y" });

        await stream.next();
        const done = await stream.next();

        expect(done.done).toBe(true);
        expect(done.value).toEqual({
            ad: "# Oferta",
            usage: {
                inputTokens: 10,
                outputTokens: 20,
                totalTokens: 30,
            },
        });
    });

    it("deve lançar InvalidAdFormatException quando anúncio final não estiver em Markdown", async () => {
        const graph = {
            stream: jest.fn().mockResolvedValue(
                createAsyncIterable([
                    [{ content: "Texto sem heading" }, { langgraph_node: "generateAd" }],
                ])
            ),
        };

        const generator = new AdStreamGenerator(graph, MessageParser);

        await expect(async () => {
            for await (const _token of generator.stream({ input: "Produto Z" })) {
                // noop
            }
        }).rejects.toThrow(InvalidAdFormatException);
    });
});
