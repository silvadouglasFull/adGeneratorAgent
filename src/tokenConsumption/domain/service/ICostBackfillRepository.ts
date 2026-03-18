export type BackfillCandidate = {
    requestId: string;
    heliconeRequestId: string;
};

export interface ICostBackfillRepository {
    findCostBackfillCandidates(limit: number): Promise<BackfillCandidate[]>;
    updateCostByRequestId(params: {
        requestId: string;
        costUSD: number;
        costBRL: number;
        exchangeRateAtExecution: number;
    }): Promise<boolean>;
}
