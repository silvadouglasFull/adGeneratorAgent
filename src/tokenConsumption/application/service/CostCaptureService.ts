import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { ICostCaptureService } from "@/tokenConsumption/domain/service/ICostCaptureService";
import { IExchangeRateAdapter } from "@/tokenConsumption/domain/service/IExchangeRateAdapter";
import { IHeliconeCostAdapter } from "@/tokenConsumption/domain/service/IHeliconeCostAdapter";

export class CostCaptureService implements ICostCaptureService {
    private static readonly DEFAULT_MAX_ATTEMPTS = 3;
    private static readonly DEFAULT_RETRY_DELAY_MS = 500;

    constructor(
        private readonly heliconeCostAdapter: IHeliconeCostAdapter,
        private readonly exchangeRateAdapter: IExchangeRateAdapter,
        private readonly maxAttempts: number = CostCaptureService.DEFAULT_MAX_ATTEMPTS,
        private readonly retryDelayMs: number = CostCaptureService.DEFAULT_RETRY_DELAY_MS
    ) { }

    async capture(heliconeRequestId: string): Promise<CostRecord> {
        try {
            const exchangeRate = await this.exchangeRateAdapter.getUSDtoBRL();
            const costUSD = await this.getCostWithRetry(heliconeRequestId);

            return CostRecord.create({
                costUSD,
                exchangeRateAtExecution: exchangeRate,
                heliconeRequestId,
            });
        } catch {
            return CostRecord.zero();
        }
    }

    private async getCostWithRetry(heliconeRequestId: string): Promise<number> {
        const attempts = Math.max(1, this.maxAttempts);

        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            const costUSD = await this.heliconeCostAdapter.getCostByRequestId(heliconeRequestId);

            if (costUSD > 0 || attempt === attempts) {
                return costUSD;
            }

            const delay = Math.max(0, this.retryDelayMs) * attempt;
            await this.sleep(delay);
        }

        return 0;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
