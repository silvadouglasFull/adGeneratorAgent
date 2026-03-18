import dotEnv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
dotEnv.config()
console.log(process.env.DATABASE_URL)
export default defineConfig({
    dialect: 'postgresql',
    schema: './src/tokenConsumption/infrastructure/db/schema.ts',
    out: './src/tokenConsumption/infrastructure/db/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ad_generator',
    },
    verbose: true,
    strict: true,
});
