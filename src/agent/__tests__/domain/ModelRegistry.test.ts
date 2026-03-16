import { ModelNotFoundException } from "../../domain/exception/ModelNotFoundException";
import { ModelRegistry } from "../../domain/model/ModelRegistry";

describe("ModelRegistry", () => {
    let registry: ModelRegistry;

    beforeEach(() => {
        registry = ModelRegistry.default();
    });

    it("deve retornar configuração para modelo válido", () => {
        const config = registry.get("gpt-4o-mini");
        expect(config).toBeDefined();
        expect(config.modelProvider).toBe("openai");
    });

    it("deve lançar ModelNotFoundException para modelo inválido", () => {
        expect(() => {
            registry.get("modelo-invalido" as any);
        }).toThrow(ModelNotFoundException);
    });

    it("isSupported deve retornar true para modelo válido", () => {
        expect(registry.isSupported("gpt-4o-mini")).toBe(true);
        expect(registry.isSupported("gemini-2.0-flash")).toBe(true);
    });

    it("isSupported deve retornar false para modelo inválido", () => {
        expect(registry.isSupported("modelo-invalido")).toBe(false);
        expect(registry.isSupported(123)).toBe(false);
    });

    it("deve retornar instância com modelos padrão via factory", () => {
        const defaultRegistry = ModelRegistry.default();
        expect(defaultRegistry.get("gpt-4o-mini")).toBeDefined();
        expect(defaultRegistry.get("gemini-2.0-flash")).toBeDefined();
    });

    it("deve passar apiKey para gemini-2.0-flash", () => {
        process.env.GENAI_API = "test-api-key";
        const freshRegistry = ModelRegistry.default();
        const config = freshRegistry.get("gemini-2.0-flash");
        expect(config.apiKey).toBe("test-api-key");
    });
});
