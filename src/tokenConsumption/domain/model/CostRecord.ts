import { CostRecordValidationException } from "../exception/CostRecordValidationException";

type CreateCostRecordParams = {
    costUSD: number;
    exchangeRateAtExecution: number;
    heliconeRequestId: string | null;
};

export class CostRecord {
    readonly costUSD: number;
    readonly costBRL: number;
    readonly exchangeRateAtExecution: number;
    readonly heliconeRequestId: string | null;

    private constructor(
        costUSD: number,
        costBRL: number,
        exchangeRateAtExecution: number,
        heliconeRequestId: string | null
    ) {
        this.costUSD = costUSD;
        this.costBRL = costBRL;
        this.exchangeRateAtExecution = exchangeRateAtExecution;
        this.heliconeRequestId = heliconeRequestId;
    }

    static create(params: CreateCostRecordParams): CostRecord {
        const { costUSD, exchangeRateAtExecution, heliconeRequestId } = params;

        if (costUSD < 0) {
            throw new CostRecordValidationException("costUSD não pode ser negativo");
        }

        if (exchangeRateAtExecution < 0) {
            throw new CostRecordValidationException("exchangeRateAtExecution não pode ser negativo");
        }

        const costBRL = Math.round(costUSD * exchangeRateAtExecution * 1_000_000) / 1_000_000;

        return new CostRecord(costUSD, costBRL, exchangeRateAtExecution, heliconeRequestId);
    }

    static zero(): CostRecord {
        return new CostRecord(0, 0, 0, null);
    }
}
