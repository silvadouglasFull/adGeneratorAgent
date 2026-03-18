import type {
    DashboardData,
    ITokenConsumptionDashboardRepository,
} from "../../domain/service/ITokenConsumptionDashboardRepository";

export class TokenConsumptionDashboardService {
    constructor(
        private readonly repository: ITokenConsumptionDashboardRepository
    ) { }

    async getDashboardData(userId?: string): Promise<DashboardData> {
        return this.repository.getDashboardData(userId);
    }
}
