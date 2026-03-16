import { TokenAggregation } from "@/tokenConsumption/domain/model/TokenAggregation";

describe("TokenAggregation", () => {
    it("deve criar agregação válida", () => {
        const aggregation = TokenAggregation.create({
            periodStart: new Date("2026-03-10T00:00:00.000Z"),
            periodEnd: new Date("2026-03-16T23:59:59.000Z"),
            totalTokens: 1500,
            requestCount: 10,
            byModel: {
                "gpt-4o-mini": 900,
                "gemini-2.0-flash": 600,
            },
        });

        expect(aggregation.totalTokens).toBe(1500);
        expect(aggregation.requestCount).toBe(10);
        expect(aggregation.byModel["gpt-4o-mini"]).toBe(900);
    });

    it("deve lançar erro quando periodStart > periodEnd", () => {
        expect(() => {
            TokenAggregation.create({
                periodStart: new Date("2026-03-17T00:00:00.000Z"),
                periodEnd: new Date("2026-03-16T23:59:59.000Z"),
                totalTokens: 100,
                requestCount: 1,
                byModel: {
                    "gpt-4o-mini": 100,
                    "gemini-2.0-flash": 0,
                },
            });
        }).toThrow("periodStart não pode ser maior que periodEnd");
    });
});
