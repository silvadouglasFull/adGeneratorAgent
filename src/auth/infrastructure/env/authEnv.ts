import { z } from "zod";

const authEnvSchema = z.object({
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID não definido."),
    GOOGLE_CLIENT_SECRETE: z.string().min(1, "GOOGLE_CLIENT_SECRETE não definido."),
    NEXT_AUTH_SECRETE: z.string().min(1, "NEXT_AUTH_SECRETE não definido."),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export function getAuthEnv(env: Partial<NodeJS.ProcessEnv> = process.env): AuthEnv {
    const parsed = authEnvSchema.safeParse({
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRETE: env.GOOGLE_CLIENT_SECRETE,
        NEXT_AUTH_SECRETE: env.NEXT_AUTH_SECRETE,
    });

    if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => issue.message).join(" ");
        throw new Error(`Variáveis de autenticação inválidas. ${issues}`.trim());
    }

    return parsed.data;
}
