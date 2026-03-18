import {
    BackfillCandidate,
    ICostBackfillRepository,
} from "@/tokenConsumption/domain/service/ICostBackfillRepository";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db as defaultDb } from "../db/client";
import { tokenConsumptionsTable } from "../db/schema";

type DatabaseLike = typeof defaultDb;

export class TokenCostBackfillRepository implements ICostBackfillRepository {
    constructor(private readonly db: DatabaseLike = defaultDb) { }

    async findCostBackfillCandidates(limit: number): Promise<BackfillCandidate[]> {
        const safeLimit = Math.max(1, limit);

        const rows = await this.db
            .select({
                requestId: tokenConsumptionsTable.requestId,
                heliconeRequestId: tokenConsumptionsTable.heliconeRequestId,
            })
            .from(tokenConsumptionsTable)
            .where(
                and(
                    isNotNull(tokenConsumptionsTable.heliconeRequestId),
                    sql`${tokenConsumptionsTable.costUsd}::numeric = 0`
                )
            )
            .orderBy(asc(tokenConsumptionsTable.createdAt))
            .limit(safeLimit);

        return rows
            .filter(
                (
                    row
                ): row is {
                    requestId: string;
                    heliconeRequestId: string;
                } => Boolean(row.heliconeRequestId)
            )
            .map((row) => ({
                requestId: row.requestId,
                heliconeRequestId: row.heliconeRequestId,
            }));
    }

    async updateCostByRequestId(params: {
        requestId: string;
        costUSD: number;
        costBRL: number;
        exchangeRateAtExecution: number;
    }): Promise<boolean> {
        const updated = await this.db
            .update(tokenConsumptionsTable)
            .set({
                costUsd: String(params.costUSD),
                costBrl: String(params.costBRL),
                exchangeRateAtExecution: String(params.exchangeRateAtExecution),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(tokenConsumptionsTable.requestId, params.requestId),
                    sql`${tokenConsumptionsTable.costUsd}::numeric = 0`
                )
            )
            .returning({ requestId: tokenConsumptionsTable.requestId });

        return updated.length > 0;
    }
}
