import { ImageIntentDetector } from "../../domain/service/ImageIntentDetector";

describe("ImageIntentDetector", () => {
    let detector: ImageIntentDetector;

    beforeEach(() => {
        detector = new ImageIntentDetector();
    });

    it("deve retornar true para input com pedido explícito de imagem", () => {
        expect(detector.detect("Gere uma imagem para este anúncio")).toBe(true);
        expect(detector.detect("Crie um anúncio com imagem")).toBe(true);
        expect(detector.detect("Quero uma imagem publicitária")).toBe(true);
    });

    it("deve retornar true para input com palavra-chave foto", () => {
        expect(detector.detect("Gere o anúncio com foto")).toBe(true);
        expect(detector.detect("Quero uma foto do imóvel")).toBe(true);
    });

    it("deve retornar true para input com palavra visual", () => {
        expect(detector.detect("Preciso de um visual para o anúncio")).toBe(true);
    });

    it("deve retornar true para input em inglês", () => {
        expect(detector.detect("Generate an image for this ad")).toBe(true);
        expect(detector.detect("I want a picture of the property")).toBe(true);
    });

    it("deve retornar false para input sem pedido de imagem", () => {
        expect(detector.detect("Apartamento 2 quartos em Palmitos/SC")).toBe(false);
        expect(detector.detect("Gere um anúncio para este produto")).toBe(false);
    });

    it("deve retornar false para input vazio", () => {
        expect(detector.detect("")).toBe(false);
        expect(detector.detect("   ")).toBe(false);
    });

    it("deve ser case-insensitive", () => {
        expect(detector.detect("GERE UMA IMAGEM")).toBe(true);
        expect(detector.detect("Gere Uma Imagem")).toBe(true);
    });
});
