import { PromptType } from "@/prompts/domain/enum/PromptType";
import { z } from "zod";

export const createUserPromptSchema = z.object({
    userId: z.string().uuid({ message: "Usuário inválido." }),
    type: z.enum(PromptType, {
        message: "Tipo de prompt inválido.",
    }),
    content: z
        .string()
        .trim()
        .min(10, { message: "O conteúdo deve ter ao menos 10 caracteres." })
        .max(10000, { message: "O conteúdo deve ter no máximo 10000 caracteres." }),
    isActive: z.boolean().optional().default(false),
});

export type CreateUserPromptDTO = z.infer<typeof createUserPromptSchema>;
