


import { isSupportedModel, isTextModel, SUPPORTED_MODELS, TEXT_MODELS } from "../../domain/model/SupportedModel";

describe("SupportedModel", () => {
    it("deve retornar array de modelos suportados", () => {
        expect(SUPPORTED_MODELS).toEqual(["gpt-4o-mini", "gemini-2.0-flash", "gpt-image-1.5"]);
    });

    it("isSupportedModel deve retornar true para modelo válido", () => {
        expect(isSupportedModel("gpt-4o-mini")).toBe(true);
        expect(isSupportedModel("gemini-2.0-flash")).toBe(true);
        expect(isSupportedModel("gpt-image-1.5")).toBe(true);
    });

    it("isSupportedModel deve retornar false para modelo inválido", () => {
        expect(isSupportedModel("modelo-invalido")).toBe(false);
        expect(isSupportedModel(123)).toBe(false);
        expect(isSupportedModel(null)).toBe(false);
    });

    it("deve retornar array de modelos de texto", () => {
        expect(TEXT_MODELS).toEqual(["gpt-4o-mini", "gemini-2.0-flash"]);
    });

    it("isTextModel deve retornar true para modelos de texto", () => {
        expect(isTextModel("gpt-4o-mini")).toBe(true);
        expect(isTextModel("gemini-2.0-flash")).toBe(true);
    });

    it("isTextModel deve retornar false para modelo de imagem", () => {
        expect(isTextModel("gpt-image-1.5")).toBe(false);
    });
});
