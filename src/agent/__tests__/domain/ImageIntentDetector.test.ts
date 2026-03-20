import { ImageIntentDetector, PromptIntentType } from "../../domain/service/ImageIntentDetector";

describe("ImageIntentDetector", () => {
    let detector: ImageIntentDetector;

    beforeEach(() => {
        detector = new ImageIntentDetector();
    });

    it("deve retornar IMAGE_GENERATION para input com pedido explícito de imagem", () => {
        expect(detector.detect("Gere uma imagem para este produto")).toBe(PromptIntentType.IMAGE_GENERATION);
        expect(detector.detect("Crie uma imagem publicitária")).toBe(PromptIntentType.IMAGE_GENERATION);
        expect(detector.detect("Quero uma imagem publicitária")).toBe(PromptIntentType.IMAGE_GENERATION);
    });

    it("deve retornar IMAGE_GENERATION para input com palavra-chave foto", () => {
        expect(detector.detect("Gere uma foto do imóvel")).toBe(PromptIntentType.IMAGE_GENERATION);
        expect(detector.detect("Quero uma foto do imóvel")).toBe(PromptIntentType.IMAGE_GENERATION);
    });

    it("deve retornar IMAGE_GENERATION para input com palavra visual", () => {
        expect(detector.detect("Preciso de um visual para foto do imóvel")).toBe(PromptIntentType.IMAGE_GENERATION);
    });

    it("deve retornar IMAGE_GENERATION para input em inglês", () => {
        expect(detector.detect("Generate an image for this ad")).toBe(PromptIntentType.IMAGE_GENERATION);
        expect(detector.detect("I want a picture of the property")).toBe(PromptIntentType.IMAGE_GENERATION);
    });

    it("deve retornar TEXT_GENERATION para input sem pedido de imagem", () => {
        expect(detector.detect("Apartamento 2 quartos em Palmitos/SC")).toBe(PromptIntentType.TEXT_GENERATION);
        expect(detector.detect("Gere um anúncio para este produto")).toBe(PromptIntentType.TEXT_GENERATION);
    });

    it("deve retornar TEXT_GENERATION para input vazio", () => {
        expect(detector.detect("")).toBe(PromptIntentType.TEXT_GENERATION);
        expect(detector.detect("   ")).toBe(PromptIntentType.TEXT_GENERATION);
    });

    it("deve ser case-insensitive", () => {
        expect(detector.detect("GERE UMA IMAGEM")).toBe(PromptIntentType.IMAGE_GENERATION);
        expect(detector.detect("Gere Uma Imagem")).toBe(PromptIntentType.IMAGE_GENERATION);
    });

    it("deve retornar BOTH quando pedir texto e imagem", () => {
        expect(detector.detect("Crie um texto de campanha e gere uma imagem")).toBe(PromptIntentType.BOTH);
    });

    it("deve informar requiresImage corretamente", () => {
        expect(detector.requiresImage("gere uma imagem para anúncio")).toBe(true);
        expect(detector.requiresImage("gere um texto para anúncio")).toBe(false);
    });

    it("deve informar requiresText corretamente", () => {
        expect(detector.requiresText("gere um texto para anúncio")).toBe(true);
        expect(detector.requiresText("gere uma imagem do imóvel")).toBe(false);
    });
});
