const mockGetServerSession = jest.fn();

jest.mock("next-auth", () => ({
    getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

jest.mock("@/auth/infrastructure/auth/authOptions", () => ({
    authOptions: {},
}));

const mockGetDashboardData = jest.fn();

jest.mock(
    "@/tokenConsumption/infrastructure/persistence/TokenConsumptionDashboardRepository",
    () => {
        return {
            TokenConsumptionDashboardRepository: jest.fn().mockImplementation(() => ({
                getDashboardData: (...args: unknown[]) => mockGetDashboardData(...args),
            })),
        };
    }
);

import { GET } from "@/app/api/costs/dashboard/route";

const MOCK_DASHBOARD_DATA = {
    totals: {
        totalTokens: 5000,
        totalCostBRL: 1.2345,
        totalRealPerToken: 0.000247,
    },
    tokensByAd: [
        {
            requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            tokens: 2500,
            generatedAt: "2026-03-18T10:00:00.000Z",
        },
        {
            requestId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            tokens: 2500,
            generatedAt: "2026-03-18T11:00:00.000Z",
        },
    ],
    realPerTokenByAd: [
        {
            requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            realPerToken: 0.000247,
            generatedAt: "2026-03-18T10:00:00.000Z",
        },
        {
            requestId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            realPerToken: 0.000249,
            generatedAt: "2026-03-18T11:00:00.000Z",
        },
    ],
};

describe("GET /api/costs/dashboard", () => {
    beforeEach(() => {
        mockGetServerSession.mockReset();
        mockGetDashboardData.mockReset();
        mockGetDashboardData.mockResolvedValue(MOCK_DASHBOARD_DATA);
    });

    it("retorna 401 quando não há sessão", async () => {
        mockGetServerSession.mockResolvedValue(null);

        const response = await GET();

        expect(response.status).toBe(401);
        const body = await response.json() as { error: string };
        expect(body.error).toBe("Não autenticado.");
    });

    it("retorna 401 quando sessão não tem user.id", async () => {
        mockGetServerSession.mockResolvedValue({ user: { email: "user@test.com" } });

        const response = await GET();

        expect(response.status).toBe(401);
    });

    it("retorna 200 com dados do usuário autenticado", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "uuid-1" } });

        const response = await GET();

        expect(response.status).toBe(200);
        const body = await response.json() as typeof MOCK_DASHBOARD_DATA;
        expect(body.totals.totalTokens).toBe(5000);
        expect(body.totals.totalCostBRL).toBe(1.2345);
        expect(body.tokensByAd).toHaveLength(2);
        expect(body.realPerTokenByAd).toHaveLength(2);
    });

    it("chama getDashboardData com o userId da sessão", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "uuid-1" } });

        await GET();

        expect(mockGetDashboardData).toHaveBeenCalledWith("uuid-1");
    });

    it("contém os campos totals, tokensByAd e realPerTokenByAd no payload", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "uuid-1" } });

        const response = await GET();
        const body = await response.json() as Record<string, unknown>;

        expect(body).toHaveProperty("totals");
        expect(body).toHaveProperty("tokensByAd");
        expect(body).toHaveProperty("realPerTokenByAd");
    });
});
