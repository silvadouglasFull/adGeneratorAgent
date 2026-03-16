import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database client singleton
 * 
 * Creates a single database connection pool that is reused
 * throughout the application lifecycle
 * 
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string (required in production)
 *                 defaults to postgresql://postgres:postgres@localhost:5432/ad_generator
 */

let dbInstance: ReturnType<typeof drizzle> | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;

/**
 * Get or create the database connection
 * @returns Drizzle database instance with schema context
 */
export function getDatabase(): ReturnType<typeof drizzle> {
    if (dbInstance) {
        return dbInstance;
    }

    // Get connection string from environment or use default
    const connectionString =
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/ad_generator';

    // Validate connection string format
    if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
        throw new Error(
            'Invalid DATABASE_URL: must be a valid PostgreSQL connection string (postgresql://... or postgres://...)'
        );
    }

    try {
        // Create postgres client with connection pooling
        postgresClient = postgres(connectionString, {
            idle_timeout: 30, // idle timeout in seconds
            connect_timeout: 10, // connection timeout in seconds
        });

        // Create Drizzle instance with schema context
        dbInstance = drizzle(postgresClient, { schema });

        console.log('✓ Database connection established');
        return dbInstance;
    } catch (error) {
        console.error('✗ Failed to establish database connection:', error);
        throw error;
    }
}

/**
 * Close the database connection gracefully
 * Should be called during application shutdown
 */
export async function closeDatabase(): Promise<void> {
    if (postgresClient) {
        try {
            await postgresClient.end({ timeout: 5 });
            postgresClient = null;
            dbInstance = null;
            console.log('✓ Database connection closed');
        } catch (error) {
            console.error('✗ Error closing database connection:', error);
            throw error;
        }
    }
}

/**
 * Export database instance
 * Uses lazy initialization: first access triggers connection
 */
export const db = new Proxy(
    {} as ReturnType<typeof drizzle>,
    {
        get(target, prop) {
            const instance = getDatabase();
            return Reflect.get(instance, prop);
        },
    }
);

// Handle graceful shutdown on process termination
if (typeof process !== 'undefined') {
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, closing database connection...');
        await closeDatabase();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('SIGINT received, closing database connection...');
        await closeDatabase();
        process.exit(0);
    });
}
