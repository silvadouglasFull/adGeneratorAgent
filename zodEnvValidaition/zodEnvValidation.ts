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
        return envSchema.safeParse(process.env).success
    }
}
