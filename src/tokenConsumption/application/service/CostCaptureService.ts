import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { ICostCaptureService } from "@/tokenConsumption/domain/service/ICostCaptureService";
import { IExchangeRateAdapter } from "@/tokenConsumption/domain/service/IExchangeRateAdapter";
import { IHeliconeCostAdapter } from "@/tokenConsumption/domain/service/IHeliconeCostAdapter";

export class CostCaptureService implements ICostCaptureService {
    constructor(
        private readonly heliconeCostAdapter: IHeliconeCostAdapter,
        private readonly exchangeRateAdapter: IExchangeRateAdapter
    ) { }

    async capture(heliconeRequestId: string): Promise<CostRecord> {
        try {
            const [costUSD, exchangeRate] = await Promise.all([
                this.heliconeCostAdapter.getCostByRequestId(heliconeRequestId),
                this.exchangeRateAdapter.getUSDtoBRL(),
            ]);

            return CostRecord.create({
                costUSD,
                exchangeRateAtExecution: exchangeRate,
                heliconeRequestId,
            });
        } catch {
            return CostRecord.zero();
        }
    }
}
