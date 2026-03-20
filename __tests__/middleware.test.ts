import { NextRequest } from "next/server";

const mockGetToken = jest.fn();

jest.mock("next-auth/jwt", () => ({
    getToken: (arg: unknown) => mockGetToken(arg),
}));

import { isPublicPath, middleware } from "../middleware";

describe("auth middleware", () => {
    beforeEach(() => {
        mockGetToken.mockReset();
    });

    it("considera endpoint do nextauth como rota pública", () => {
        expect(isPublicPath("/api/auth/signin")).toBe(true);
    });

    it("não considera /api/auth/register como rota pública", () => {
        expect(isPublicPath("/api/auth/register")).toBe(false);
    });

    it("redireciona página protegida para /auth quando não autenticado", async () => {
        mockGetToken.mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/dashboard");
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/api/auth/signin");
    });

    it("retorna 401 para qualquer api não-nextauth quando não autenticado", async () => {
        mockGetToken.mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/auth/register");
        const response = await middleware(request);

        expect(response.status).toBe(401);
    });

    it("permite acesso quando autenticado", async () => {
        mockGetToken.mockResolvedValue({ sub: "user-1" });

        const request = new NextRequest("http://localhost:3000/dashboard");
        const response = await middleware(request);

        expect(response.status).toBe(200);
    });
});
