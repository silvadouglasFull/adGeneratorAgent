import { ImageGenerationException } from "../../domain/exception/ImageGenerationException";
import { ImageGenerationService } from "../../domain/service/ImageGenerationService";

const mockGenerate = jest.fn();

jest.mock("openai", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            images: {
                generate: (...args: unknown[]) => mockGenerate(...args),
            },
        })),
    };
});

describe("ImageGenerationService", () => {
    let service: ImageGenerationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ImageGenerationService();
    });

    it("deve retornar imageUrl e usage quando API retorna b64_json", async () => {
        mockGenerate.mockResolvedValue({
            data: [{ b64_json: "abc123base64data" }],
            usage: { input_tokens: 100, output_tokens: 200 },
        });

        const result = await service.generate("A modern apartment building");

        expect(result.imageUrl).toBe("data:image/png;base64,abc123base64data");
        expect(result.usage.inputTokens).toBe(100);
        expect(result.usage.outputTokens).toBe(200);
        expect(mockGenerate).toHaveBeenCalledWith({
            model: "gpt-image-1",
            prompt: "A modern apartment building",
            n: 1,
            size: "1024x1024",
        });
    });

    it("deve retornar URL quando API retorna url em vez de b64_json", async () => {
        mockGenerate.mockResolvedValue({
            data: [{ url: "https://openai.com/image.png" }],
            usage: { input_tokens: 50, output_tokens: 100 },
        });

        const result = await service.generate("test prompt");

        expect(result.imageUrl).toBe("https://openai.com/image.png");
    });

    it("deve lançar ImageGenerationException quando API não retorna imagem", async () => {
        mockGenerate.mockResolvedValue({ data: [{}] });

        await expect(service.generate("test")).rejects.toThrow(ImageGenerationException);
    });

    it("deve incluir mensagem sobre nenhuma imagem retornada", async () => {
        mockGenerate.mockResolvedValue({ data: [{}] });

        await expect(service.generate("test")).rejects.toThrow("Nenhuma imagem retornada pela API");
    });

    it("deve lançar ImageGenerationException quando API falha", async () => {
        mockGenerate.mockRejectedValue(new Error("API timeout"));

        await expect(service.generate("test")).rejects.toThrow(ImageGenerationException);
    });

    it("deve incluir mensagem original do erro da API", async () => {
        mockGenerate.mockRejectedValue(new Error("API timeout"));

        await expect(service.generate("test")).rejects.toThrow("API timeout");
    });

    it("deve retornar usage zerado quando API não retorna usage", async () => {
        mockGenerate.mockResolvedValue({
            data: [{ b64_json: "data" }],
        });

        const result = await service.generate("test");

        expect(result.usage.inputTokens).toBe(0);
        expect(result.usage.outputTokens).toBe(0);
    });
});
