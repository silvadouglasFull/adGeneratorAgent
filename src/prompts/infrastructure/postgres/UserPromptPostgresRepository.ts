import { CreateUserPromptDTO } from "@/prompts/application/dto/CreateUserPromptDTO";
import { IUserPromptRepository } from "@/prompts/application/repository/IUserPromptRepository";
import { UserPrompt } from "@/prompts/domain/entity/UserPrompt";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import { PromptRedisSync } from "@/prompts/infrastructure/redis/PromptRedisSync";
import { db as defaultDb } from "@/tokenConsumption/infrastructure/db/client";
import { userPromptsTable } from "@/tokenConsumption/infrastructure/db/schema";
import { and, desc, eq } from "drizzle-orm";

type DatabaseLike = typeof defaultDb;

function mapToEntity(row: typeof userPromptsTable.$inferSelect): UserPrompt {
    return new UserPrompt({
        id: row.id,
        userId: row.userId,
        type: row.type as PromptType,
        content: row.content,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    });
}

export class UserPromptPostgresRepository implements IUserPromptRepository {
    constructor(
        private readonly database: DatabaseLike = defaultDb,
        private readonly redisSync?: PromptRedisSync
    ) { }

    async create(dto: CreateUserPromptDTO): Promise<UserPrompt> {
        const [row] = await this.database
            .insert(userPromptsTable)
            .values({
                userId: dto.userId,
                type: dto.type,
                content: dto.content,
                isActive: false,
            })
            .returning();

        return mapToEntity(row);
    }

    async findByUserIdAndType(userId: string, type: PromptType): Promise<UserPrompt | null> {
        return this.findActiveByUserIdAndType(userId, type);
    }

    async findActiveByUserIdAndType(userId: string, type: PromptType): Promise<UserPrompt | null> {
        const rows = await this.database
            .select()
            .from(userPromptsTable)
            .where(
                and(
                    eq(userPromptsTable.userId, userId),
                    eq(userPromptsTable.type, type),
                    eq(userPromptsTable.isActive, true)
                )
            )
            .limit(1);

        const row = rows[0];
        return row ? mapToEntity(row) : null;
    }

    async findAllByUserId(userId: string): Promise<UserPrompt[]> {
        const rows = await this.database
            .select()
            .from(userPromptsTable)
            .where(eq(userPromptsTable.userId, userId))
            .orderBy(desc(userPromptsTable.createdAt));

        return rows.map(mapToEntity);
    }

    async findById(id: string): Promise<UserPrompt | null> {
        const rows = await this.database
            .select()
            .from(userPromptsTable)
            .where(eq(userPromptsTable.id, id))
            .limit(1);

        const row = rows[0];
        return row ? mapToEntity(row) : null;
    }

    async setActive(promptId: string): Promise<UserPrompt> {
        const activatedPrompt = await this.database.transaction(async (tx) => {
            const rows = await tx
                .select()
                .from(userPromptsTable)
                .where(eq(userPromptsTable.id, promptId))
                .limit(1);

            const targetPrompt = rows[0];

            if (!targetPrompt) {
                throw new Error("Prompt não encontrado.");
            }

            await tx
                .update(userPromptsTable)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(userPromptsTable.userId, targetPrompt.userId),
                        eq(userPromptsTable.type, targetPrompt.type)
                    )
                );

            const activatedRows = await tx
                .update(userPromptsTable)
                .set({
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(userPromptsTable.id, promptId))
                .returning();

            const activated = activatedRows[0];

            if (!activated) {
                throw new Error("Falha ao ativar prompt.");
            }

            return activated;
        });

        this.redisSync?.syncActivePromptToRedis(
            activatedPrompt.userId,
            activatedPrompt.type as PromptType,
            activatedPrompt.content
        );

        return mapToEntity(activatedPrompt);
    }

    async setInactive(promptId: string): Promise<UserPrompt> {
        const rows = await this.database
            .select()
            .from(userPromptsTable)
            .where(eq(userPromptsTable.id, promptId))
            .limit(1);

        const existingPrompt = rows[0];

        if (!existingPrompt) {
            throw new Error("Prompt não encontrado.");
        }

        const updatedRows = await this.database
            .update(userPromptsTable)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(userPromptsTable.id, promptId))
            .returning();

        const updatedPrompt = updatedRows[0];

        if (!updatedPrompt) {
            throw new Error("Falha ao desativar prompt.");
        }

        this.redisSync?.removePromptFromRedis(existingPrompt.userId, existingPrompt.type as PromptType);

        return mapToEntity(updatedPrompt);
    }

    async update(id: string, content: string): Promise<UserPrompt> {
        const rows = await this.database
            .update(userPromptsTable)
            .set({
                content,
                updatedAt: new Date(),
            })
            .where(eq(userPromptsTable.id, id))
            .returning();

        const updatedPrompt = rows[0];

        if (!updatedPrompt) {
            throw new Error("Prompt não encontrado.");
        }

        if (updatedPrompt.isActive) {
            this.redisSync?.syncActivePromptToRedis(
                updatedPrompt.userId,
                updatedPrompt.type as PromptType,
                updatedPrompt.content
            );
        }

        return mapToEntity(updatedPrompt);
    }

    async delete(id: string): Promise<void> {
        const rows = await this.database
            .select()
            .from(userPromptsTable)
            .where(eq(userPromptsTable.id, id))
            .limit(1);

        const existingPrompt = rows[0];

        if (!existingPrompt) {
            return;
        }

        await this.database
            .delete(userPromptsTable)
            .where(eq(userPromptsTable.id, id));

        if (existingPrompt.isActive) {
            this.redisSync?.removePromptFromRedis(
                existingPrompt.userId,
                existingPrompt.type as PromptType
            );
        }
    }
}
