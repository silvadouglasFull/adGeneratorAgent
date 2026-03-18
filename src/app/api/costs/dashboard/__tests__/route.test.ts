jest.mock(
    "@/tokenConsumption/infrastructure/persistence/TokenConsumptionDashboardRepository",
    () => {
        return {
            TokenConsumptionDashboardRepository: jest.fn().mockImplementation(() => ({
                getDashboardData: jest.fn().mockResolvedValue({
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
                }),
            })),
        };
    }
);

import { GET } from "@/app/api/costs/dashboard/route";

describe("GET /api/costs/dashboard", () => {
    it("deve retornar 200 com payload de dashboard quando userId está ausente", async () => {
        const request = new Request("http://localhost/api/costs/dashboard");
        const response = await GET(request);

        expect(response.status).toBe(200);
        const body = await response.json() as {
            totals: { totalTokens: number; totalCostBRL: number; totalRealPerToken: number };
            tokensByAd: unknown[];
            realPerTokenByAd: unknown[];
        };
        expect(body.totals.totalTokens).toBe(5000);
        expect(body.totals.totalCostBRL).toBe(1.2345);
        expect(body.tokensByAd).toHaveLength(2);
        expect(body.realPerTokenByAd).toHaveLength(2);
    });

    it("deve retornar 400 quando userId não é UUID válido", async () => {
        const request = new Request(
            "http://localhost/api/costs/dashboard?userId=not-a-uuid"
        );
        const response = await GET(request);

        expect(response.status).toBe(400);
        const body = await response.json() as { error: string };
        expect(body.error).toContain("UUID");
    });

    it("deve retornar 200 com dados corretos para userId UUID válido", async () => {
        const request = new Request(
            "http://localhost/api/costs/dashboard?userId=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        const body = await response.json() as {
            totals: { totalTokens: number };
            tokensByAd: unknown[];
        };
        expect(body.totals.totalTokens).toBe(5000);
        expect(body.tokensByAd[0]).toMatchObject({ tokens: 2500 });
    });

    it("deve conter campos totals, tokensByAd e realPerTokenByAd no payload", async () => {
        const request = new Request("http://localhost/api/costs/dashboard");
        const response = await GET(request);
        const body = await response.json() as Record<string, unknown>;

        expect(body).toHaveProperty("totals");
        expect(body).toHaveProperty("tokensByAd");
        expect(body).toHaveProperty("realPerTokenByAd");
    });
});
