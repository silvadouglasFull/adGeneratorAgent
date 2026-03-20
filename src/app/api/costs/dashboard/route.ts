import { authOptions } from "@/auth/infrastructure/auth/authOptions";
import { TokenConsumptionDashboardService } from "@/tokenConsumption/application/service/TokenConsumptionDashboardService";
import { TokenConsumptionDashboardRepository } from "@/tokenConsumption/infrastructure/persistence/TokenConsumptionDashboardRepository";
import { getServerSession } from "next-auth";

const dashboardService = new TokenConsumptionDashboardService(
    new TokenConsumptionDashboardRepository()
);

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const data = await dashboardService.getDashboardData(session.user.id);
    return Response.json(data, { status: 200 });
}
