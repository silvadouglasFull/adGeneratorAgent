const mockGetAvailableModels = jest.fn();

jest.mock("@/agent/modelCatalogService", () => ({
    modelCatalogService: {
        getAvailableModels: (...args: unknown[]) => mockGetAvailableModels(...args),
    },
}));

import { GET } from "../route";

describe("GET /api/agent/models", () => {
    beforeEach(() => {
        mockGetAvailableModels.mockReset();
    });

    it("retorna 200 com lista de modelos disponíveis", async () => {
        mockGetAvailableModels.mockResolvedValue([
            { name: "gpt-4o-mini", provider: "openai", isFree: false, isDefault: true },
            { name: "gemini-2.0-flash", provider: "google-gemini", isFree: true, isDefault: true },
        ]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.models).toHaveLength(2);
        expect(data.models[0]).toEqual({
            name: "gpt-4o-mini",
            displayName: "GPT-4o Mini",
            provider: "openai",
            isFree: false,
        });
        expect(data.models[1]).toEqual({
            name: "gemini-2.0-flash",
            displayName: "Gemini 2.0 Flash",
            provider: "google-gemini",
            isFree: true,
        });
        expect(mockGetAvailableModels).toHaveBeenCalledWith("default");
    });

    it("retorna displayName bruto quando modelo não possui mapeamento", async () => {
        mockGetAvailableModels.mockResolvedValue([
            { name: "custom-model-v1", provider: "openai", isFree: false },
        ]);

        const response = await GET();
        const data = await response.json();

        expect(data.models[0].displayName).toBe("custom-model-v1");
    });

    it("retorna 200 com lista vazia quando não há modelos", async () => {
        mockGetAvailableModels.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.models).toEqual([]);
    });

    it("retorna 500 quando o serviço falha", async () => {
        mockGetAvailableModels.mockRejectedValue(new Error("Provider indisponível"));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Não foi possível carregar os modelos disponíveis.");
    });
});
