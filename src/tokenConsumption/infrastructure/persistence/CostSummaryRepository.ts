import { tokenConsumptionsTable } from "@/tokenConsumption/infrastructure/db/schema";
import { eq, max, min, sql } from "drizzle-orm";
import { db as defaultDb } from "../db/client";

type CostByModel = {
    totalCostUSD: number;
    requestCount: number;
};

export type CostSummary = {
    totalCostUSD: number;
    totalCostBRL: number;
    requestCount: number;
    byModel: Record<string, CostByModel>;
    period: {
        start: string | null;
        end: string | null;
    };
};

type DatabaseLike = typeof defaultDb;

export class CostSummaryRepository {
    constructor(private readonly db: DatabaseLike = defaultDb) { }

    async getSummary(userId?: string): Promise<CostSummary> {
        const query = this.db
            .select({
                modelUsed: tokenConsumptionsTable.modelUsed,
                totalCostUSD: sql<string>`coalesce(sum(${tokenConsumptionsTable.costUsd}), 0)`,
                totalCostBRL: sql<string>`coalesce(sum(${tokenConsumptionsTable.costBrl}), 0)`,
                requestCount: sql<number>`count(*)::int`,
                minTimestamp: min(tokenConsumptionsTable.timestamp),
                maxTimestamp: max(tokenConsumptionsTable.timestamp),
            })
            .from(tokenConsumptionsTable);

        if (userId) {
            query.where(eq(tokenConsumptionsTable.userId, userId));
        }

        const rows = (await query.groupBy(tokenConsumptionsTable.modelUsed)) as Array<{
            modelUsed: string;
            totalCostUSD: string;
            totalCostBRL: string;
            requestCount: number;
            minTimestamp: Date | null;
            maxTimestamp: Date | null;
        }>;

        let totalCostUSD = 0;
        let totalCostBRL = 0;
        let requestCount = 0;
        const byModel: Record<string, CostByModel> = {};
        let periodStart: Date | null = null;
        let periodEnd: Date | null = null;

        for (const row of rows) {
            const modelCostUSD = parseFloat(row.totalCostUSD) || 0;
            const modelCostBRL = parseFloat(row.totalCostBRL) || 0;

            totalCostUSD += modelCostUSD;
            totalCostBRL += modelCostBRL;
            requestCount += row.requestCount;

            byModel[row.modelUsed] = {
                totalCostUSD: modelCostUSD,
                requestCount: row.requestCount,
            };

            if (row.minTimestamp && (!periodStart || row.minTimestamp < periodStart)) {
                periodStart = row.minTimestamp;
            }
            if (row.maxTimestamp && (!periodEnd || row.maxTimestamp > periodEnd)) {
                periodEnd = row.maxTimestamp;
            }
        }

        return {
            totalCostUSD,
            totalCostBRL,
            requestCount,
            byModel,
            period: {
                start: periodStart?.toISOString() ?? null,
                end: periodEnd?.toISOString() ?? null,
            },
        };
    }
}
