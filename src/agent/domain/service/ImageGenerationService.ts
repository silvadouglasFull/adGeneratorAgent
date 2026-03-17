import OpenAI from "openai";
import { ImageGenerationException } from "../exception/ImageGenerationException";

export type ImageGenerationResult = {
    imageUrl: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
};

export class ImageGenerationService {
    private client: OpenAI;

    constructor(client?: OpenAI) {
        this.client = client ?? new OpenAI();
    }

    async generate(prompt: string): Promise<ImageGenerationResult> {
        try {
            const response = await this.client.images.generate({
                model: "gpt-image-1",
                prompt,
                n: 1,
                size: "1024x1024",
            });

            const imageData = response.data?.[0];

            if (!imageData?.b64_json && !imageData?.url) {
                throw new ImageGenerationException("Nenhuma imagem retornada pela API");
            }

            const imageUrl = imageData.b64_json
                ? `data:image/png;base64,${imageData.b64_json}`
                : imageData.url!;

            const usage = {
                inputTokens: (response as unknown as { usage?: { input_tokens?: number } }).usage?.input_tokens ?? 0,
                outputTokens: (response as unknown as { usage?: { output_tokens?: number } }).usage?.output_tokens ?? 0,
            };

            return { imageUrl, usage };
        } catch (error) {
            if (error instanceof ImageGenerationException) {
                throw error;
            }

            const message = error instanceof Error ? error.message : "Erro desconhecido";
            throw new ImageGenerationException(message);
        }
    }
}
