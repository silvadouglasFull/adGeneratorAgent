import { HeliconeCostAdapter } from "@/tokenConsumption/infrastructure/providers/HeliconeCostAdapter";

describe("HeliconeCostAdapter", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("deve retornar cost_usd do payload do Helicone", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: { cost: 0.0001 } }),
        });

        const adapter = new HeliconeCostAdapter("sk-helicone-test");
        const cost = await adapter.getCostByRequestId("hel-123");

        expect(cost).toBe(0.0001);
        expect(global.fetch).toHaveBeenCalledWith(
            "https://api.helicone.ai/v1/request/hel-123",
            expect.objectContaining({
                method: "GET",
                headers: { Authorization: "Bearer sk-helicone-test" },
            })
        );
    });

    it("deve retornar cost do campo raiz se data.cost não existe", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ cost: 0.005 }),
        });

        const adapter = new HeliconeCostAdapter("sk-helicone-test");
        const cost = await adapter.getCostByRequestId("hel-456");

        expect(cost).toBe(0.005);
    });

    it("deve retornar 0 em erro de rede", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("network error"));

        const adapter = new HeliconeCostAdapter("sk-helicone-test");
        const cost = await adapter.getCostByRequestId("hel-123");

        expect(cost).toBe(0);
    });

    it("deve retornar 0 quando HTTP status não é ok", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        const adapter = new HeliconeCostAdapter("sk-helicone-test");
        const cost = await adapter.getCostByRequestId("hel-123");

        expect(cost).toBe(0);
    });

    it("deve retornar 0 quando apiKey está ausente", async () => {
        const adapter = new HeliconeCostAdapter(undefined);
        const cost = await adapter.getCostByRequestId("hel-123");

        expect(cost).toBe(0);
    });
});
