import { TokenConsumptionDashboardService } from "@/tokenConsumption/application/service/TokenConsumptionDashboardService";
import { TokenConsumptionDashboardRepository } from "@/tokenConsumption/infrastructure/persistence/TokenConsumptionDashboardRepository";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const dashboardService = new TokenConsumptionDashboardService(
    new TokenConsumptionDashboardRepository()
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId !== null && !UUID_REGEX.test(userId)) {
        return Response.json(
            { error: "Query param 'userId' deve ser um UUID válido." },
            { status: 400 }
        );
    }

    const data = await dashboardService.getDashboardData(userId ?? undefined);
    return Response.json(data, { status: 200 });
}
