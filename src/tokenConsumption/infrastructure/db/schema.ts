import {
    index,
    integer,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar
} from 'drizzle-orm/pg-core';

/**
 * Enum for status of token consumption persistence
 */
export const tokenConsumptionStatusEnum = pgEnum('token_consumption_status', [
    'success',
    'failed',
]);

/**
 * Token Consumption tracking table
 *
 * Stores all token consumption events from the Ad Generator Agent
 * with idempotency via requestId and retry capabilities
 */
export const tokenConsumptionsTable = pgTable(
    'token_consumptions',
    {
        // Primary key
        id: uuid('id').primaryKey().defaultRandom().notNull(),

        // Idempotency key - ensures duplicate requests are handled gracefully
        requestId: uuid('request_id').notNull().unique(),

        // Model used for generation
        modelUsed: varchar('model_used', { length: 50 }).notNull(),

        // Token counts
        inputTokens: integer('input_tokens').notNull(),
        outputTokens: integer('output_tokens').notNull(),

        // Timestamp of consumption (UTC)
        timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' })
            .notNull()
            .defaultNow(),

        // Status of persistence
        status: tokenConsumptionStatusEnum('status').notNull().default('success'),

        // Error details if status is 'failed'
        errorMessage: text('error_message'),

        // Helicone cost tracking fields (immutable after persistence)
        heliconeRequestId: varchar('helicone_request_id', { length: 100 }),
        costUsd: numeric('cost_usd', { precision: 12, scale: 8 }).notNull().default('0'),
        costBrl: numeric('cost_brl', { precision: 12, scale: 8 }).notNull().default('0'),
        exchangeRateAtExecution: numeric('exchange_rate_at_execution', { precision: 10, scale: 6 }).notNull().default('0'),

        // User identification for cost summary queries
        userId: varchar('user_id', { length: 100 }),

        // Audit timestamps
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => ({
        // Unique index for idempotency
        requestIdIdx: uniqueIndex('idx_request_id').on(table.requestId),
        statusIdx: index('idx_status').on(table.status),
        timestampIdx: index('idx_timestamp').on(table.timestamp),
        modelUsedIdx: index('idx_model_used').on(table.modelUsed),
        userIdIdx: index('idx_user_id').on(table.userId),
    })
);

/**
 * Drizzle type exports for schema introspection
 * Used in migrations and database operations
 */
export type TokenConsumption = typeof tokenConsumptionsTable.$inferSelect;
export type NewTokenConsumption = typeof tokenConsumptionsTable.$inferInsert;
