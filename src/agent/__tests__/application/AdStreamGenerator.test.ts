import { AdStreamGenerator, StreamResult } from "../../application/stream/AdStreamGenerator";
import { MessageParser } from "../../application/stream/MessageParser";
import { InvalidAdFormatException } from "../../domain/exception/InvalidAdFormatException";
import { ImageIntentDetector } from "../../domain/service/ImageIntentDetector";

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
        let finalResult: StreamResult | undefined;

        for (; ;) {
            const step = await stream.next();
            if (step.done) {
                finalResult = step.value;
                break;
            }
            emittedTokens.push(step.value);
        }

        expect(emittedTokens).toEqual(["# Título", "\n\nDescrição"]);
        expect(finalResult).toEqual({ ad: "# Título\n\nDescrição", usage: undefined, imageUrl: undefined, imageUsage: undefined });
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
            imageUrl: undefined,
            imageUsage: undefined,
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

    it("deve retornar imageUrl e imageUsage quando imagem for solicitada", async () => {
        const graph = {
            stream: jest.fn().mockResolvedValue(
                createAsyncIterable([
                    [{ content: "# Anúncio com Imagem" }, { langgraph_node: "generateAd" }],
                ])
            ),
        };

        const imageIntentDetector = new ImageIntentDetector();
        const mockImagePromptService = {
            generate: jest.fn().mockResolvedValue("A modern apartment HDR shot"),
        };
        const mockImageGenerationService = {
            generate: jest.fn().mockResolvedValue({
                imageUrl: "data:image/png;base64,abc123",
                usage: { inputTokens: 100, outputTokens: 200 },
            }),
        };

        const generator = new AdStreamGenerator(
            graph,
            MessageParser,
            imageIntentDetector,
            mockImagePromptService as any,
            mockImageGenerationService as any
        );

        const stream = generator.stream({ input: "Produto com imagem publicitária" });

        let finalResult: StreamResult | undefined;
        for (; ;) {
            const step = await stream.next();
            if (step.done) {
                finalResult = step.value;
                break;
            }
        }

        expect(finalResult?.imageUrl).toBe("data:image/png;base64,abc123");
        expect(finalResult?.imageUsage).toEqual({ inputTokens: 100, outputTokens: 200 });
        expect(mockImagePromptService.generate).toHaveBeenCalledWith("Produto com imagem publicitária", undefined);
        expect(mockImageGenerationService.generate).toHaveBeenCalledWith("A modern apartment HDR shot");
    });

    it("deve retornar sem imagem quando input não solicitar imagem", async () => {
        const graph = {
            stream: jest.fn().mockResolvedValue(
                createAsyncIterable([
                    [{ content: "# Anúncio Simples" }, { langgraph_node: "generateAd" }],
                ])
            ),
        };

        const imageIntentDetector = new ImageIntentDetector();
        const mockImagePromptService = { generate: jest.fn() };
        const mockImageGenerationService = { generate: jest.fn() };

        const generator = new AdStreamGenerator(
            graph,
            MessageParser,
            imageIntentDetector,
            mockImagePromptService as any,
            mockImageGenerationService as any
        );

        const stream = generator.stream({ input: "Produto premium luxo" });

        let finalResult: StreamResult | undefined;
        for (; ;) {
            const step = await stream.next();
            if (step.done) {
                finalResult = step.value;
                break;
            }
        }

        expect(finalResult?.imageUrl).toBeUndefined();
        expect(finalResult?.imageUsage).toBeUndefined();
        expect(mockImagePromptService.generate).not.toHaveBeenCalled();
        expect(mockImageGenerationService.generate).not.toHaveBeenCalled();
    });
});
