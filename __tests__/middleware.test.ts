import { NextRequest } from "next/server";

const mockGetToken = jest.fn();

jest.mock("next-auth/jwt", () => ({
    getToken: (arg: unknown) => mockGetToken(arg),
}));

import { middleware } from "../middleware";

describe("auth middleware", () => {
    beforeEach(() => {
        mockGetToken.mockReset();
    });

    it("redireciona /dashboard para /auth/login quando não autenticado", async () => {
        mockGetToken.mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/dashboard");
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/auth/login");
    });

    it("redireciona / para /auth/login quando não autenticado", async () => {
        mockGetToken.mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/");
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/auth/login");
    });

    it("permite acesso a /dashboard quando autenticado", async () => {
        mockGetToken.mockResolvedValue({ sub: "user-1" });

        const request = new NextRequest("http://localhost:3000/dashboard", {
            headers: {
                cookie: "next-auth.session-token=mock-token",
            },
        });
        const response = await middleware(request);

        expect(response.status).toBe(200);
    });

    it("permite acesso a / quando autenticado", async () => {
        mockGetToken.mockResolvedValue({ sub: "user-1" });

        const request = new NextRequest("http://localhost:3000/", {
            headers: {
                cookie: "next-auth.session-token=mock-token",
            },
        });
        const response = await middleware(request);

        expect(response.status).toBe(200);
    });
});
