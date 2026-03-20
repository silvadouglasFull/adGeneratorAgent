import { z } from "zod";

export const registerWithCredentialsSchema = z.object({
    email: z.string().trim().email("Email inválido."),
    password: z
        .string()
        .min(8, "Senha deve ter no mínimo 8 caracteres.")
        .max(128, "Senha deve ter no máximo 128 caracteres."),
    name: z
        .string()
        .trim()
        .min(2, "Nome deve ter no mínimo 2 caracteres.")
        .max(120, "Nome deve ter no máximo 120 caracteres."),
});

export type RegisterWithCredentialsInput = z.infer<typeof registerWithCredentialsSchema>;
