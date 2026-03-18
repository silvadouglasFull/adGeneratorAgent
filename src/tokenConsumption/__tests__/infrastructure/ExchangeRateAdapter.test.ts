import { ExchangeRateAdapter } from "@/tokenConsumption/infrastructure/providers/ExchangeRateAdapter";

describe("ExchangeRateAdapter", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("deve retornar taxa de câmbio corretamente", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ USDBRL: { ask: "5.789" } }),
        });

        const adapter = new ExchangeRateAdapter();
        const rate = await adapter.getUSDtoBRL();

        expect(rate).toBe(5.789);
        expect(global.fetch).toHaveBeenCalledWith(
            "https://economia.awesomeapi.com.br/json/last/USD-BRL"
        );
    });

    it("deve retornar fallback 6.0 quando payload é inválido", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ USDBRL: {} }),
        });

        const adapter = new ExchangeRateAdapter();
        const rate = await adapter.getUSDtoBRL();

        expect(rate).toBe(6.0);
    });

    it("deve retornar fallback 6.0 em erro de rede", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("network error"));

        const adapter = new ExchangeRateAdapter();
        const rate = await adapter.getUSDtoBRL();

        expect(rate).toBe(6.0);
    });

    it("deve retornar fallback 6.0 quando HTTP status não é ok", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 503,
        });

        const adapter = new ExchangeRateAdapter();
        const rate = await adapter.getUSDtoBRL();

        expect(rate).toBe(6.0);
    });

    it("deve retornar fallback 6.0 quando ask não é número válido", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ USDBRL: { ask: "invalid" } }),
        });

        const adapter = new ExchangeRateAdapter();
        const rate = await adapter.getUSDtoBRL();

        expect(rate).toBe(6.0);
    });
});
