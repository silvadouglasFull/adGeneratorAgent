import { registerWithCredentialsSchema } from "@/auth/application/validation/registerWithCredentialsSchema";

describe("registerWithCredentialsSchema", () => {
    it("aceita payload válido", () => {
        const parsed = registerWithCredentialsSchema.safeParse({
            email: "user@example.com",
            password: "12345678",
            name: "Usuário Teste",
        });

        expect(parsed.success).toBe(true);
    });

    it("rejeita payload inválido", () => {
        const parsed = registerWithCredentialsSchema.safeParse({
            email: "invalido",
            password: "123",
            name: "a",
        });

        expect(parsed.success).toBe(false);
    });
});
