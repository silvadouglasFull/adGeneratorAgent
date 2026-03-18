import { eq, sql } from "drizzle-orm";
import type {
    AdRealPerTokenEntry,
    AdTokenEntry,
    DashboardData,
    DashboardTotals,
    ITokenConsumptionDashboardRepository,
} from "../../domain/service/ITokenConsumptionDashboardRepository";
import { db as defaultDb } from "../db/client";
import { tokenConsumptionsTable } from "../db/schema";

type DatabaseLike = typeof defaultDb;

export class TokenConsumptionDashboardRepository
    implements ITokenConsumptionDashboardRepository {
    constructor(private readonly db: DatabaseLike = defaultDb) { }

    async getDashboardData(userId?: string): Promise<DashboardData> {
        const totals = await this.getTotals(userId);
        const tokensByAd = await this.getTokensByAd(userId);
        const realPerTokenByAd = await this.getRealPerTokenByAd(userId);

        return { totals, tokensByAd, realPerTokenByAd };
    }

    private async getTotals(userId?: string): Promise<DashboardTotals> {
        const query = this.db
            .select({
                totalInputTokens: sql<string>`coalesce(sum(${tokenConsumptionsTable.inputTokens}), 0)`,
                totalOutputTokens: sql<string>`coalesce(sum(${tokenConsumptionsTable.outputTokens}), 0)`,
                totalCostBRL: sql<string>`coalesce(sum(${tokenConsumptionsTable.costBrl}), 0)`,
            })
            .from(tokenConsumptionsTable)
            .$dynamic();

        if (userId) {
            query.where(eq(tokenConsumptionsTable.userId, userId));
        }

        const [row] = await query;

        const totalTokens =
            (parseInt(row?.totalInputTokens ?? "0", 10) || 0) +
            (parseInt(row?.totalOutputTokens ?? "0", 10) || 0);
        const totalCostBRL = parseFloat(row?.totalCostBRL ?? "0") || 0;
        const totalRealPerToken = totalTokens > 0 ? totalCostBRL / totalTokens : 0;

        return { totalTokens, totalCostBRL, totalRealPerToken };
    }

    private async getTokensByAd(userId?: string): Promise<AdTokenEntry[]> {
        const query = this.db
            .select({
                requestId: tokenConsumptionsTable.requestId,
                inputTokens: tokenConsumptionsTable.inputTokens,
                outputTokens: tokenConsumptionsTable.outputTokens,
                generatedAt: tokenConsumptionsTable.timestamp,
            })
            .from(tokenConsumptionsTable)
            .orderBy(tokenConsumptionsTable.timestamp)
            .$dynamic();

        if (userId) {
            query.where(eq(tokenConsumptionsTable.userId, userId));
        }

        const rows = await query;

        return rows.map((row) => ({
            requestId: row.requestId,
            tokens: (row.inputTokens ?? 0) + (row.outputTokens ?? 0),
            generatedAt: row.generatedAt?.toISOString() ?? new Date().toISOString(),
        }));
    }

    private async getRealPerTokenByAd(
        userId?: string
    ): Promise<AdRealPerTokenEntry[]> {
        const query = this.db
            .select({
                requestId: tokenConsumptionsTable.requestId,
                inputTokens: tokenConsumptionsTable.inputTokens,
                outputTokens: tokenConsumptionsTable.outputTokens,
                costBrl: tokenConsumptionsTable.costBrl,
                generatedAt: tokenConsumptionsTable.timestamp,
            })
            .from(tokenConsumptionsTable)
            .orderBy(tokenConsumptionsTable.timestamp)
            .$dynamic();

        if (userId) {
            query.where(eq(tokenConsumptionsTable.userId, userId));
        }

        const rows = await query;

        return rows.map((row) => {
            const tokens = (row.inputTokens ?? 0) + (row.outputTokens ?? 0);
            const costBrl = parseFloat(row.costBrl ?? "0") || 0;
            const realPerToken = tokens > 0 ? costBrl / tokens : 0;
            return {
                requestId: row.requestId,
                realPerToken,
                generatedAt: row.generatedAt?.toISOString() ?? new Date().toISOString(),
            };
        });
    }
}
