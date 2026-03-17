import { SupportedModel } from "@/agent/domain/model/SupportedModel";
import { CostRecord } from "../model/CostRecord";
import { TokenAggregation } from "../model/TokenAggregation";
import { TokenConsumptionEvent } from "../model/TokenConsumptionEvent";

export interface ITokenConsumptionRepository {
    save(event: TokenConsumptionEvent, costRecord?: CostRecord): Promise<void>;
    getTotalTokensByModel(model: SupportedModel): Promise<number>;
    getTotalTokensByPeriod(startDate: Date, endDate: Date): Promise<TokenAggregation>;
    getByRequestId(requestId: string): Promise<TokenConsumptionEvent | null>;
    getFailedEvents(limit: number): Promise<TokenConsumptionEvent[]>;
}
