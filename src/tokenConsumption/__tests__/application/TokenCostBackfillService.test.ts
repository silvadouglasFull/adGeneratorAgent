import { TokenCostBackfillService } from "@/tokenConsumption/application/service/TokenCostBackfillService";
import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { ICostBackfillRepository } from "@/tokenConsumption/domain/service/ICostBackfillRepository";
import { ICostCaptureService } from "@/tokenConsumption/domain/service/ICostCaptureService";

describe("TokenCostBackfillService", () => {
    let repository: jest.Mocked<ICostBackfillRepository>;
    let costCaptureService: jest.Mocked<ICostCaptureService>;
    let service: TokenCostBackfillService;

    beforeEach(() => {
        repository = {
            findCostBackfillCandidates: jest.fn(),
            updateCostByRequestId: jest.fn(),
        };

        costCaptureService = {
            capture: jest.fn(),
        };

        service = new TokenCostBackfillService(repository, costCaptureService);
    });

    it("deve atualizar registros quando custo > 0", async () => {
        repository.findCostBackfillCandidates.mockResolvedValue([
            { requestId: "req-1", heliconeRequestId: "hel-1" },
        ]);
        costCaptureService.capture.mockResolvedValue(
            CostRecord.create({
                costUSD: 0.0004,
                exchangeRateAtExecution: 5.2,
                heliconeRequestId: "hel-1",
            })
        );
        repository.updateCostByRequestId.mockResolvedValue(true);

        const result = await service.execute(10);

        expect(result).toEqual({ scanned: 1, updated: 1, skipped: 0, failed: 0 });
        expect(repository.updateCostByRequestId).toHaveBeenCalledTimes(1);
    });

    it("deve marcar skipped quando custo permanece zero", async () => {
        repository.findCostBackfillCandidates.mockResolvedValue([
            { requestId: "req-1", heliconeRequestId: "hel-1" },
        ]);
        costCaptureService.capture.mockResolvedValue(
            CostRecord.create({
                costUSD: 0,
                exchangeRateAtExecution: 5.2,
                heliconeRequestId: "hel-1",
            })
        );

        const result = await service.execute(10);

        expect(result).toEqual({ scanned: 1, updated: 0, skipped: 1, failed: 0 });
        expect(repository.updateCostByRequestId).not.toHaveBeenCalled();
    });

    it("deve marcar failed quando um item falha e continuar processamento", async () => {
        repository.findCostBackfillCandidates.mockResolvedValue([
            { requestId: "req-1", heliconeRequestId: "hel-1" },
            { requestId: "req-2", heliconeRequestId: "hel-2" },
        ]);

        costCaptureService.capture
            .mockRejectedValueOnce(new Error("erro"))
            .mockResolvedValueOnce(
                CostRecord.create({
                    costUSD: 0.001,
                    exchangeRateAtExecution: 5.1,
                    heliconeRequestId: "hel-2",
                })
            );
        repository.updateCostByRequestId.mockResolvedValue(true);

        const result = await service.execute(10);

        expect(result).toEqual({ scanned: 2, updated: 1, skipped: 0, failed: 1 });
    });
});
