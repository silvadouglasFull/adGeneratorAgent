import { TokenCostBackfillService } from "@/tokenConsumption/application/service/TokenCostBackfillService";
import { TokenCostBackfillRepository } from "@/tokenConsumption/infrastructure/persistence/TokenCostBackfillRepository";
import { tokenConsumptionContainer } from "@/tokenConsumption/tokenConsumption";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

const backfillService = new TokenCostBackfillService(
    new TokenCostBackfillRepository(),
    tokenConsumptionContainer.costCaptureService
);

function isValidLimit(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= MAX_LIMIT
    );
}

export async function POST(request: Request) {
    let body: { limit?: unknown } = {};

    try {
        const raw = await request.text();
        if (raw.trim() !== "") {
            body = JSON.parse(raw) as { limit?: unknown };
        }
    } catch {
        return Response.json(
            { error: "Body inválido. Envie um JSON válido." },
            { status: 400 }
        );
    }

    const limit = body.limit ?? DEFAULT_LIMIT;

    if (!isValidLimit(limit)) {
        return Response.json(
            { error: "Campo 'limit' deve ser inteiro entre 1 e 500." },
            { status: 400 }
        );
    }

    const result = await backfillService.execute(limit);
    return Response.json(result, { status: 200 });
}
