import { SupportedModel } from "@/agent/domain/model/SupportedModel";

export class TokenAggregation {
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly totalTokens: number;
    readonly requestCount: number;
    readonly byModel: Readonly<Record<SupportedModel, number>>;

    private constructor(
        periodStart: Date,
        periodEnd: Date,
        totalTokens: number,
        requestCount: number,
        byModel: Record<SupportedModel, number>
    ) {
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.totalTokens = totalTokens;
        this.requestCount = requestCount;
        this.byModel = Object.freeze(byModel);
    }

    static create(params: {
        periodStart: Date;
        periodEnd: Date;
        totalTokens: number;
        requestCount: number;
        byModel: Record<SupportedModel, number>;
    }): TokenAggregation {
        const { periodStart, periodEnd, totalTokens, requestCount, byModel } = params;

        if (!(periodStart instanceof Date) || Number.isNaN(periodStart.getTime())) {
            throw new Error("periodStart deve ser uma data válida");
        }

        if (!(periodEnd instanceof Date) || Number.isNaN(periodEnd.getTime())) {
            throw new Error("periodEnd deve ser uma data válida");
        }

        if (periodStart.getTime() > periodEnd.getTime()) {
            throw new Error("periodStart não pode ser maior que periodEnd");
        }

        if (totalTokens < 0 || requestCount < 0) {
            throw new Error("totalTokens e requestCount não podem ser negativos");
        }

        return new TokenAggregation(periodStart, periodEnd, totalTokens, requestCount, byModel);
    }
}
