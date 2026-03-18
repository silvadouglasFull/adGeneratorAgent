export type DashboardTotals = {
    totalTokens: number;
    totalCostBRL: number;
    totalRealPerToken: number;
};

export type AdTokenEntry = {
    requestId: string;
    tokens: number;
    generatedAt: string;
};

export type AdRealPerTokenEntry = {
    requestId: string;
    realPerToken: number;
    generatedAt: string;
};

export type DashboardData = {
    totals: DashboardTotals;
    tokensByAd: AdTokenEntry[];
    realPerTokenByAd: AdRealPerTokenEntry[];
};

export interface ITokenConsumptionDashboardRepository {
    getDashboardData(userId?: string): Promise<DashboardData>;
}
