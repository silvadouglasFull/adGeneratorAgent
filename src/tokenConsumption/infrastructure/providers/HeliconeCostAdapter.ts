import { IHeliconeCostAdapter } from "@/tokenConsumption/domain/service/IHeliconeCostAdapter";

export class HeliconeCostAdapter implements IHeliconeCostAdapter {
    private static readonly BASE_URL = "https://api.helicone.ai/v1";

    constructor(
        private readonly apiKey: string | undefined = process.env.HELICONE_API_KEY
    ) { }

    async getCostByRequestId(heliconeRequestId: string): Promise<number> {
        if (!this.apiKey) {
            console.warn("[HeliconeCostAdapter] HELICONE_API_KEY ausente, retornando custo 0");
            return 0;
        }

        try {
            const response = await fetch(
                `${HeliconeCostAdapter.BASE_URL}/request/${encodeURIComponent(heliconeRequestId)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );

            if (!response.ok) {
                console.warn(
                    `[HeliconeCostAdapter] Erro ao buscar custo (HTTP ${response.status}), retornando 0`
                );
                return 0;
            }

            const body = await response.json();
            const cost = body?.data?.cost ?? body?.cost ?? 0;
            const parsed = typeof cost === "number" ? cost : parseFloat(cost);

            return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        } catch (error) {
            console.warn("[HeliconeCostAdapter] Falha ao buscar custo do Helicone, retornando 0", error);
            return 0;
        }
    }
}
