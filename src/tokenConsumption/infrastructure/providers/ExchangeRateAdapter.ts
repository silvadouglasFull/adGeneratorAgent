import { IExchangeRateAdapter } from "@/tokenConsumption/domain/service/IExchangeRateAdapter";

export class ExchangeRateAdapter implements IExchangeRateAdapter {
    private static readonly API_URL = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
    private static readonly FALLBACK_RATE = 6.0;

    async getUSDtoBRL(): Promise<number> {
        try {
            const response = await fetch(ExchangeRateAdapter.API_URL);

            if (!response.ok) {
                console.warn(
                    `[ExchangeRateAdapter] Erro ao buscar taxa de câmbio (HTTP ${response.status}), usando fallback ${ExchangeRateAdapter.FALLBACK_RATE}`
                );
                return ExchangeRateAdapter.FALLBACK_RATE;
            }

            const body = await response.json();
            const askValue = body?.USDBRL?.ask;

            if (!askValue) {
                console.warn("[ExchangeRateAdapter] Campo ask ausente, usando fallback");
                return ExchangeRateAdapter.FALLBACK_RATE;
            }

            const rate = parseFloat(askValue);

            if (!Number.isFinite(rate) || rate <= 0) {
                console.warn("[ExchangeRateAdapter] Taxa inválida, usando fallback");
                return ExchangeRateAdapter.FALLBACK_RATE;
            }

            return rate;
        } catch (error) {
            console.warn(
                `[ExchangeRateAdapter] Falha ao buscar taxa, usando fallback ${ExchangeRateAdapter.FALLBACK_RATE}`,
                error
            );
            return ExchangeRateAdapter.FALLBACK_RATE;
        }
    }
}
