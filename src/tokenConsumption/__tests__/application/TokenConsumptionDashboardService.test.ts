import { TokenConsumptionDashboardService } from "@/tokenConsumption/application/service/TokenConsumptionDashboardService";
import type { ITokenConsumptionDashboardRepository } from "@/tokenConsumption/domain/service/ITokenConsumptionDashboardRepository";

const mockDashboardData = {
    totals: {
        totalTokens: 3000,
        totalCostBRL: 0.9,
        totalRealPerToken: 0.0003,
    },
    tokensByAd: [
        {
            requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            tokens: 1500,
            generatedAt: "2026-03-18T09:00:00.000Z",
        },
        {
            requestId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            tokens: 1500,
            generatedAt: "2026-03-18T10:00:00.000Z",
        },
    ],
    realPerTokenByAd: [
        {
            requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            realPerToken: 0.0003,
            generatedAt: "2026-03-18T09:00:00.000Z",
        },
        {
            requestId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            realPerToken: 0.0003,
            generatedAt: "2026-03-18T10:00:00.000Z",
        },
    ],
};

function makeRepo(
    override?: Partial<ITokenConsumptionDashboardRepository>
): ITokenConsumptionDashboardRepository {
    return {
        getDashboardData: jest.fn().mockResolvedValue(mockDashboardData),
        ...override,
    };
}

describe("TokenConsumptionDashboardService", () => {
    it("deve delegar chamada ao repositório e retornar os dados", async () => {
        const repo = makeRepo();
        const service = new TokenConsumptionDashboardService(repo);

        const result = await service.getDashboardData();

        expect(repo.getDashboardData).toHaveBeenCalledWith(undefined);
        expect(result.totals.totalTokens).toBe(3000);
        expect(result.tokensByAd).toHaveLength(2);
        expect(result.realPerTokenByAd).toHaveLength(2);
    });

    it("deve passar userId ao repositório quando informado", async () => {
        const repo = makeRepo();
        const service = new TokenConsumptionDashboardService(repo);

        await service.getDashboardData("user-uuid-123");

        expect(repo.getDashboardData).toHaveBeenCalledWith("user-uuid-123");
    });

    it("deve retornar totalRealPerToken calculado corretamente", async () => {
        const repo = makeRepo();
        const service = new TokenConsumptionDashboardService(repo);

        const result = await service.getDashboardData();

        expect(result.totals.totalRealPerToken).toBe(0.0003);
    });

    it("deve retornar arrays vazios quando repositório retorna listas vazias", async () => {
        const repo = makeRepo({
            getDashboardData: jest.fn().mockResolvedValue({
                totals: { totalTokens: 0, totalCostBRL: 0, totalRealPerToken: 0 },
                tokensByAd: [],
                realPerTokenByAd: [],
            }),
        });
        const service = new TokenConsumptionDashboardService(repo);

        const result = await service.getDashboardData();

        expect(result.tokensByAd).toHaveLength(0);
        expect(result.realPerTokenByAd).toHaveLength(0);
        expect(result.totals.totalTokens).toBe(0);
    });
});
