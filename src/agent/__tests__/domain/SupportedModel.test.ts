import { isSupportedModel, SUPPORTED_MODELS } from "../../domain/model/SupportedModel";

describe("SupportedModel", () => {
    it("deve retornar array de modelos suportados", () => {
        expect(SUPPORTED_MODELS).toEqual(["gpt-4o-mini", "gemini-2.0-flash"]);
    });

    it("isSupportedModel deve retornar true para modelo válido", () => {
        expect(isSupportedModel("gpt-4o-mini")).toBe(true);
        expect(isSupportedModel("gemini-2.0-flash")).toBe(true);
    });

    it("isSupportedModel deve retornar false para modelo inválido", () => {
        expect(isSupportedModel("modelo-invalido")).toBe(false);
        expect(isSupportedModel(123)).toBe(false);
        expect(isSupportedModel(null)).toBe(false);
    });
});
