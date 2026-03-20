import { getAuthEnv } from "@/auth/infrastructure/env/authEnv";

describe("getAuthEnv", () => {
    it("retorna env quando todas variáveis obrigatórias estão definidas", () => {
        const env = getAuthEnv({
            GOOGLE_CLIENT_ID: "google-id",
            GOOGLE_CLIENT_SECRETE: "google-secret",
            NEXT_AUTH_SECRETE: "next-auth-secret",
        });

        expect(env.GOOGLE_CLIENT_ID).toBe("google-id");
        expect(env.GOOGLE_CLIENT_SECRETE).toBe("google-secret");
        expect(env.NEXT_AUTH_SECRETE).toBe("next-auth-secret");
    });

    it("lança erro quando faltar variável obrigatória", () => {
        expect(() =>
            getAuthEnv({
                GOOGLE_CLIENT_ID: "google-id",
                NEXT_AUTH_SECRETE: "next-auth-secret",
            })
        ).toThrow("Variáveis de autenticação inválidas");
    });
});
