import { CostCaptureService } from "@/tokenConsumption/application/service/CostCaptureService";
import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { IExchangeRateAdapter } from "@/tokenConsumption/domain/service/IExchangeRateAdapter";
import { IHeliconeCostAdapter } from "@/tokenConsumption/domain/service/IHeliconeCostAdapter";

describe("CostCaptureService", () => {
    let heliconeCostAdapter: jest.Mocked<IHeliconeCostAdapter>;
    let exchangeRateAdapter: jest.Mocked<IExchangeRateAdapter>;
    let service: CostCaptureService;

    beforeEach(() => {
        heliconeCostAdapter = {
            getCostByRequestId: jest.fn(),
        };
        exchangeRateAdapter = {
            getUSDtoBRL: jest.fn(),
        };
        service = new CostCaptureService(heliconeCostAdapter, exchangeRateAdapter);
    });

    it("deve retornar CostRecord com custo correto", async () => {
        heliconeCostAdapter.getCostByRequestId.mockResolvedValue(0.0001);
        exchangeRateAdapter.getUSDtoBRL.mockResolvedValue(5.5);

        const result = await service.capture("hel-123");

        expect(result.costUSD).toBe(0.0001);
        expect(result.costBRL).toBe(
            Math.round(0.0001 * 5.5 * 1_000_000) / 1_000_000
        );
        expect(result.exchangeRateAtExecution).toBe(5.5);
        expect(result.heliconeRequestId).toBe("hel-123");
    });

    it("deve retornar CostRecord.zero() em falha do Helicone", async () => {
        heliconeCostAdapter.getCostByRequestId.mockRejectedValue(
            new Error("network error")
        );
        exchangeRateAdapter.getUSDtoBRL.mockResolvedValue(5.5);

        const result = await service.capture("hel-123");

        expect(result).toEqual(CostRecord.zero());
    });

    it("deve aplicar fallback de câmbio em falha do ExchangeRateAdapter", async () => {
        heliconeCostAdapter.getCostByRequestId.mockResolvedValue(0.0001);
        exchangeRateAdapter.getUSDtoBRL.mockResolvedValue(6.0);

        const result = await service.capture("hel-123");

        expect(result.exchangeRateAtExecution).toBe(6.0);
        expect(result.costBRL).toBe(
            Math.round(0.0001 * 6.0 * 1_000_000) / 1_000_000
        );
    });

    it("deve chamar ambos adaptadores em paralelo", async () => {
        heliconeCostAdapter.getCostByRequestId.mockResolvedValue(0.01);
        exchangeRateAdapter.getUSDtoBRL.mockResolvedValue(5.0);

        await service.capture("hel-456");

        expect(heliconeCostAdapter.getCostByRequestId).toHaveBeenCalledWith("hel-456");
        expect(exchangeRateAdapter.getUSDtoBRL).toHaveBeenCalledTimes(1);
    });

    it("deve tentar novamente quando Helicone retorna custo 0 antes de materializar", async () => {
        const retryService = new CostCaptureService(
            heliconeCostAdapter,
            exchangeRateAdapter,
            3,
            0
        );

        heliconeCostAdapter.getCostByRequestId
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0.0004971);
        exchangeRateAdapter.getUSDtoBRL.mockResolvedValue(5.22);

        const result = await retryService.capture("hel-latency-test");

        expect(heliconeCostAdapter.getCostByRequestId).toHaveBeenCalledTimes(3);
        expect(result.costUSD).toBe(0.0004971);
        expect(result.costBRL).toBeGreaterThan(0);
    });
});
