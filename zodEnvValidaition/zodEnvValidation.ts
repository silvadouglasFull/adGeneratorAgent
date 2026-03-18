import { z } from 'zod';

const envSchema = z.object({
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    DATABASE_URL: z.string(),
    REDIS_USERNAME: z.string(),
    REDIS_PASSWORD: z.string(),
    REDIS_PORT: z.number(),
    HELICONE_API_KEY: z.string(),
    LITELLM_API_KEY: z.string(),
    HELICONE_OPENAI_BASE_URL: z.string(),
    HELICONE_GEMINI_BASE_URL: z.string(),
    GEMINI_TARGET_URL: z.string(),
});

export class ZodEnvValidation {
    public static isValid(): boolean {
        return envSchema.safeParse({
            POSTGRES_DB: process.env.POSTGRES_DB,
            POSTGRES_USER: process.env.POSTGRES_USER,
            POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
            DATABASE_URL: process.env.DATABASE_URL,
            REDIS_USERNAME: process.env.REDIS_USERNAME,
            REDIS_PASSWORD: process.env.REDIS_PASSWORD,
            REDIS_PORT: process.env.REDIS_PORT,
            HELICONE_API_KEY: process.env.HELICONE_API_KEY,
            LITELLM_API_KEY: process.env.LITELLM_API_KEY,
            HELICONE_OPENAI_BASE_URL: process.env.HELICONE_OPENAI_BASE_URL,
            HELICONE_GEMINI_BASE_URL: process.env.HELICONE_GEMINI_BASE_URL,
            GEMINI_TARGET_URL: process.env.GEMINI_TARGET_URL,
        }).success
    }
}
