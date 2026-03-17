import { CostSummaryRepository } from "@/tokenConsumption/infrastructure/persistence/CostSummaryRepository";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isValidUserId = (userId: string | null) => {
    return (userId && !UUID_REGEX.test(userId))
}
const costSummaryRepository = new CostSummaryRepository();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!isValidUserId(userId)) {
        return Response.json(
            { error: "Query param 'userId' deve ser um UUID válido." },
            { status: 400 }
        );
    }
    const summary = await costSummaryRepository.getSummary(userId ?? undefined);

    return Response.json(summary, { status: 200 });
}
