const mockHandler = jest.fn(async () => new Response(null, { status: 200 }));
const mockNextAuth = jest.fn(() => mockHandler);

jest.mock("next-auth", () => ({
    __esModule: true,
    default: mockNextAuth,
}));

jest.mock("@/auth/infrastructure/auth/authOptions", () => ({
    authOptions: { providers: [] },
}));

import { GET, POST } from "../route";

describe("/api/auth/[...nextauth] route", () => {
    it("exporta GET e POST com o handler do NextAuth", async () => {
        const getResponse = await GET(new Request("http://localhost/api/auth/session"));
        const postResponse = await POST(new Request("http://localhost/api/auth/signin", { method: "POST" }));

        expect(mockNextAuth).toHaveBeenCalledTimes(1);
        expect(mockHandler).toHaveBeenCalledTimes(2);
        expect(getResponse.status).toBe(200);
        expect(postResponse.status).toBe(200);
    });
});
