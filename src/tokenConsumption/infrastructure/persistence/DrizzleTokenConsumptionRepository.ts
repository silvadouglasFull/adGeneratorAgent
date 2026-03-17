import { SUPPORTED_MODELS, SupportedModel, isSupportedModel } from "@/agent/domain/model/SupportedModel";
import { TokenConsumptionRepositoryException } from "@/tokenConsumption/domain/exception/TokenConsumptionRepositoryException";
import { TokenAggregation } from "@/tokenConsumption/domain/model/TokenAggregation";
import {
    TokenConsumptionEvent,
    TokenConsumptionStatus,
} from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
import { ITokenConsumptionRepository } from "@/tokenConsumption/domain/service/ITokenConsumptionRepository";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db as defaultDb } from "../db/client";
import { tokenConsumptionsTable } from "../db/schema";

type DatabaseLike = typeof defaultDb;

type TokenConsumptionRow = {
    requestId: string;
    modelUsed: string;
    inputTokens: number;
    outputTokens: number;
    timestamp: Date;
    status: TokenConsumptionStatus;
    errorMessage: string | null;
};

export class DrizzleTokenConsumptionRepository implements ITokenConsumptionRepository {
    constructor(private readonly db: DatabaseLike = defaultDb) { }

    async save(event: TokenConsumptionEvent): Promise<void> {
        try {
            await this.db
                .insert(tokenConsumptionsTable)
                .values({
                    requestId: event.requestId,
                    modelUsed: event.modelUsed,
                    inputTokens: event.inputTokens,
                    outputTokens: event.outputTokens,
                    timestamp: event.timestamp,
                    status: event.status,
                    errorMessage: event.errorMessage ?? null,
                })
                .onConflictDoNothing({ target: tokenConsumptionsTable.requestId });
        } catch (error) {
            throw new TokenConsumptionRepositoryException(
                "Erro ao persistir consumo de tokens",
                error
            );
        }
    }

    async getTotalTokensByModel(model: SupportedModel): Promise<number> {
        try {
            const result = await this.db
                .select({
                    totalTokens:
                        sql<number>`coalesce(sum(${tokenConsumptionsTable.inputTokens} + ${tokenConsumptionsTable.outputTokens}), 0)`,
                })
                .from(tokenConsumptionsTable)
                .where(eq(tokenConsumptionsTable.modelUsed, model));

            const row = (result as Array<{ totalTokens: number }>)[0];
            return Number(row?.totalTokens ?? 0);
        } catch (error) {
            throw new TokenConsumptionRepositoryException(
                "Erro ao buscar total de tokens por modelo",
                error
            );
        }
    }

    async getTotalTokensByPeriod(startDate: Date, endDate: Date): Promise<TokenAggregation> {
        try {
            const rows = (await this.db
                .select({
                    modelUsed: tokenConsumptionsTable.modelUsed,
                    totalTokens:
                        sql<number>`coalesce(sum(${tokenConsumptionsTable.inputTokens} + ${tokenConsumptionsTable.outputTokens}), 0)`,
                    requestCount: sql<number>`count(*)`,
                })
                .from(tokenConsumptionsTable)
                .where(
                    and(
                        gte(tokenConsumptionsTable.timestamp, startDate),
                        lte(tokenConsumptionsTable.timestamp, endDate)
                    )
                )
                .groupBy(tokenConsumptionsTable.modelUsed)) as Array<{
                    modelUsed: string;
                    totalTokens: number;
                    requestCount: number;
                }>;

            const byModel: Record<SupportedModel, number> = {
                "gpt-4o-mini": 0,
                "gemini-2.0-flash": 0,
                "gpt-image-1.5": 0,
            };

            let totalTokens = 0;
            let requestCount = 0;

            for (const row of rows) {
                if (!isSupportedModel(row.modelUsed)) {
                    continue;
                }

                const modelTotal = Number(row.totalTokens ?? 0);
                const modelRequests = Number(row.requestCount ?? 0);

                byModel[row.modelUsed] = modelTotal;
                totalTokens += modelTotal;
                requestCount += modelRequests;
            }

            return TokenAggregation.create({
                periodStart: startDate,
                periodEnd: endDate,
                totalTokens,
                requestCount,
                byModel,
            });
        } catch (error) {
            throw new TokenConsumptionRepositoryException(
                "Erro ao buscar total de tokens por período",
                error
            );
        }
    }

    async getByRequestId(requestId: string): Promise<TokenConsumptionEvent | null> {
        try {
            const rows = (await this.db
                .select()
                .from(tokenConsumptionsTable)
                .where(eq(tokenConsumptionsTable.requestId, requestId))
                .limit(1)) as TokenConsumptionRow[];

            if (!rows[0]) {
                return null;
            }

            return this.toDomain(rows[0]);
        } catch (error) {
            throw new TokenConsumptionRepositoryException(
                "Erro ao buscar consumo por requestId",
                error
            );
        }
    }

    async getFailedEvents(limit: number): Promise<TokenConsumptionEvent[]> {
        try {
            const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;

            const rows = (await this.db
                .select()
                .from(tokenConsumptionsTable)
                .where(eq(tokenConsumptionsTable.status, "failed"))
                .orderBy(desc(tokenConsumptionsTable.timestamp))
                .limit(safeLimit)) as TokenConsumptionRow[];

            return rows.map((row) => this.toDomain(row));
        } catch (error) {
            throw new TokenConsumptionRepositoryException(
                "Erro ao buscar eventos com falha",
                error
            );
        }
    }

    private toDomain(row: TokenConsumptionRow): TokenConsumptionEvent {
        const model = this.parseModel(row.modelUsed);
        const status = row.status === "failed" ? "failed" : "success";

        return TokenConsumptionEvent.create({
            requestId: row.requestId,
            modelUsed: model,
            inputTokens: row.inputTokens,
            outputTokens: row.outputTokens,
            timestamp: row.timestamp,
            status,
            errorMessage: status === "failed" ? row.errorMessage ?? "Erro não informado" : undefined,
        });
    }

    private parseModel(value: string): SupportedModel {
        if (isSupportedModel(value)) {
            return value;
        }

        throw new TokenConsumptionRepositoryException(
            `Modelo inválido no banco de dados: ${value}. Modelos suportados: ${SUPPORTED_MODELS.join(", ")}`
        );
    }
}
