import { AdGenerationRequest } from "../../domain/model/AdGenerationRequest";

describe("AdGenerationRequest", () => {
    it("deve criar request com valores válidos", () => {
        const request = AdGenerationRequest.create(
            "Produto X",
            "Instruções",
            "gpt-4o-mini"
        );
        expect(request.input).toBe("Produto X");
        expect(request.instructions).toBe("Instruções");
        expect(request.model).toBe("gpt-4o-mini");
    });

    it("deve criar request com model undefined", () => {
        const request = AdGenerationRequest.create(
            "Produto Y",
            "Instruções"
        );
        expect(request.model).toBeUndefined();
    });

    it("deve lançar erro se input vazio", () => {
        expect(() => {
            AdGenerationRequest.create("", "Instruções");
        }).toThrow("Input não pode ser vazio");
    });

    it("deve lançar erro se instructions vazio", () => {
        expect(() => {
            AdGenerationRequest.create("Produto", "");
        }).toThrow("Instructions não podem ser vazias");
    });
});
