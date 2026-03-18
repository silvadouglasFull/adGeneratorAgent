import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../client';
import { tokenConsumptionsTable } from '../schema';

/**
 * Seed function to populate initial test data
 * 
 * Inserts 20 sample token consumption records with realistic data:
 * - 60% gpt-4o-mini, 40% gemini-2.0-flash
 * - Token counts ranging from realistic values (100-1000 input, 200-2000 output)
 * - Dates spread across the last 7 days
 */
export async function seed(): Promise<void> {
  try {
    console.log('Seeding token consumption data...');

    // Check if data already exists to prevent duplicate seeds
    const existingCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tokenConsumptionsTable);

    if (existingCount[0]?.count > 0) {
      console.log(`⚠ Database already contains ${existingCount[0].count} records. Skipping seed.`);
      return;
    }

    // Generate 20 sample records
    const now = new Date();
    const seedData = Array.from({ length: 20 }, (_, i) => {
      const isOpenAI = Math.random() < 0.6;
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);

      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

      return {
        requestId: uuidv4(),
        modelUsed: isOpenAI ? 'gpt-4o-mini' : 'gemini-2.0-flash',
        inputTokens: Math.floor(Math.random() * 900) + 100, // 100-1000
        outputTokens: Math.floor(Math.random() * 1800) + 200, // 200-2000
        timestamp,
        status: 'success' as const,
        errorMessage: null,
        costUsd: isOpenAI
          ? (Math.random() * 0.009 + 0.0001).toFixed(8)
          : (Math.random() * 0.005 + 0.0001).toFixed(8),
        costBrl: isOpenAI
          ? (Math.random() * 0.05 + 0.0005).toFixed(8)
          : (Math.random() * 0.03 + 0.0005).toFixed(8),
        exchangeRateAtExecution: (Math.random() * 0.5 + 5.5).toFixed(6),
        heliconeRequestId: Math.random() > 0.3 ? uuidv4() : null,
        userId: null,
      };
    });

    // Insert all records
    await db.insert(tokenConsumptionsTable).values(seedData);

    console.log(`✓ Seeded ${seedData.length} token consumption records`);
  } catch (error) {
    console.error('✗ Seed failed:', error);
    throw error;
  }
}

// If run directly (for CLI usage)
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✓ Seed completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ Seed error:', err);
      process.exit(1);
    });
}
