jest.mock("@/tokenConsumption/infrastructure/persistence/CostSummaryRepository", () => {
    return {
        CostSummaryRepository: jest.fn().mockImplementation(() => ({
            getSummaryByUserId: jest.fn().mockResolvedValue({
                totalCostUSD: 0.04321,
                totalCostBRL: 0.230012,
                requestCount: 42,
                byModel: {
                    "gpt-4o-mini": { totalCostUSD: 0.03, requestCount: 30 },
                    "gemini-2.0-flash": { totalCostUSD: 0.01321, requestCount: 12 },
                },
                period: {
                    start: "2026-01-01T00:00:00.000Z",
                    end: "2026-03-17T23:59:59.000Z",
                },
            }),
        })),
    };
});

import { GET } from "@/app/api/costs/summary/route";

describe("GET /api/costs/summary", () => {
    it("deve retornar 400 quando userId está ausente", async () => {
        const request = new Request("http://localhost/api/costs/summary");
        const response = await GET(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain("userId");
    });

    it("deve retornar 400 quando userId não é UUID válido", async () => {
        const request = new Request("http://localhost/api/costs/summary?userId=invalid");
        const response = await GET(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain("UUID");
    });

    it("deve retornar 200 com payload correto para userId válido", async () => {
        const request = new Request(
            "http://localhost/api/costs/summary?userId=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        const body = await response.json();

        expect(body.totalCostUSD).toBe(0.04321);
        expect(body.totalCostBRL).toBe(0.230012);
        expect(body.requestCount).toBe(42);
        expect(body.byModel["gpt-4o-mini"].totalCostUSD).toBe(0.03);
        expect(body.byModel["gpt-4o-mini"].requestCount).toBe(30);
        expect(body.period.start).toBe("2026-01-01T00:00:00.000Z");
    });
});
