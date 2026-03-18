import {
    BackfillCandidate,
    ICostBackfillRepository,
} from "@/tokenConsumption/domain/service/ICostBackfillRepository";
import { ICostCaptureService } from "@/tokenConsumption/domain/service/ICostCaptureService";

export type TokenCostBackfillResult = {
    scanned: number;
    updated: number;
    skipped: number;
    failed: number;
};

export class TokenCostBackfillService {
    constructor(
        private readonly repository: ICostBackfillRepository,
        private readonly costCaptureService: ICostCaptureService
    ) { }

    async execute(limit: number): Promise<TokenCostBackfillResult> {
        const safeLimit = Math.max(1, limit);
        const candidates = await this.repository.findCostBackfillCandidates(safeLimit);

        const result: TokenCostBackfillResult = {
            scanned: candidates.length,
            updated: 0,
            skipped: 0,
            failed: 0,
        };

        for (const candidate of candidates) {
            await this.processCandidate(candidate, result);
        }

        return result;
    }

    private async processCandidate(
        candidate: BackfillCandidate,
        result: TokenCostBackfillResult
    ): Promise<void> {
        try {
            const costRecord = await this.costCaptureService.capture(candidate.heliconeRequestId);

            if (costRecord.costUSD <= 0) {
                result.skipped += 1;
                return;
            }

            const updated = await this.repository.updateCostByRequestId({
                requestId: candidate.requestId,
                costUSD: costRecord.costUSD,
                costBRL: costRecord.costBRL,
                exchangeRateAtExecution: costRecord.exchangeRateAtExecution,
            });

            if (updated) {
                result.updated += 1;
                return;
            }

            result.skipped += 1;
        } catch {
            result.failed += 1;
        }
    }
}
