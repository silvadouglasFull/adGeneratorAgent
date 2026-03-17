import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client';

/**
 * Run all pending migrations against the database
 * 
 * This function should be called at application startup
 * to ensure the schema is up to date before operations begin
 */
export async function runMigrations(): Promise<void> {
    try {
        console.log('Running database migrations...');
        await migrate(db, {
            migrationsFolder: './src/tokenConsumption/infrastructure/db/migrations',
        });
        console.log('✓ Migrations completed successfully');
    } catch (error) {
        console.error('✗ Migration failed:', error);
        throw error;
    }
}

// If run directly (for CLI usage)
if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
