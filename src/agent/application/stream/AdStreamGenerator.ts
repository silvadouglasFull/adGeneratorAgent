import { RunnableConfig } from "@langchain/core/runnables";
import { InvalidAdFormatException } from "../../domain/exception/InvalidAdFormatException";
import { SupportedModel } from "../../domain/model/SupportedModel";
import { MessageParser } from "./MessageParser";

export class AdStreamGenerator {
    constructor(
        private graph: any,
        private messageParser: typeof MessageParser
    ) { }

    async *stream({
        input,
        model,
    }: {
        input: string;
        model?: SupportedModel;
    }): AsyncGenerator<string, { ad: string }, void> {
        const stream = (await this.graph.stream(
            { input, model },
            { streamMode: "messages" } as RunnableConfig
        )) as AsyncIterable<[unknown, { langgraph_node?: string }]>;

        let fullAd = "";

        for await (const [messageChunk, metadata] of stream) {
            if (metadata?.langgraph_node !== "generateAd") {
                continue;
            }

            const token = this.messageParser.parse(
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
            throw new InvalidAdFormatException();
        }

        return { ad: trimmedAd };
    }
}
