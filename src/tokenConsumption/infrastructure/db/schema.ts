import {
    integer,
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
        // Error details if status is 'failed'
        errorMessage: text('error_message'),

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

    })
);

/**
 * Drizzle type exports for schema introspection
 * Used in migrations and database operations
 */
export type TokenConsumption = typeof tokenConsumptionsTable.$inferSelect;
export type NewTokenConsumption = typeof tokenConsumptionsTable.$inferInsert;
