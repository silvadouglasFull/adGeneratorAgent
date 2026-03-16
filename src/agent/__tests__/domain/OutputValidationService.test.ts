


import { InvalidAdFormatException } from "../../domain/exception/InvalidAdFormatException";
import { OutputValidationService } from "../../domain/service/OutputValidationService";

describe("OutputValidationService", () => {
    let service: OutputValidationService;

    beforeEach(() => {
        service = new OutputValidationService();
    });

    it("deve validar anúncio com formato Markdown válido", () => {
        const validAd = "# Produto X\n\n**Benefício**\n\nCompre agora!";
        const result = service.validate(validAd);
        expect(result).toBe(validAd.trim());
    });

    it("deve trimizar espaços em branco", () => {
        const adWithSpaces = "  \n  # Produto\n\nDescrição  \n  ";
        const result = service.validate(adWithSpaces);
        expect(result).toBe("# Produto\n\nDescrição");
    });

    it("deve lançar InvalidAdFormatException se não começa com #", () => {
        expect(() => {
            service.validate("Produto sem header");
        }).toThrow(InvalidAdFormatException);
    });

    it("deve lançar InvalidAdFormatException se vazio", () => {
        expect(() => {
            service.validate("");
        }).toThrow(InvalidAdFormatException);
    });

    it("deve lançar InvalidAdFormatException se contains apenas espaços", () => {
        expect(() => {
            service.validate("   ");
        }).toThrow(InvalidAdFormatException);
    });

    it("deve aceitar # com espaços antes", () => {
        const adWithLeadingSpaces = "  \n  # Produto";
        const result = service.validate(adWithLeadingSpaces);
        expect(result.startsWith("#")).toBe(true);
    });
});
