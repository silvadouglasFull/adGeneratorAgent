import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";

export interface ITokenConsumptionQueueConsumer {
    start(): Promise<void>;
    stop(): Promise<void>;
    process(event: TokenConsumptionEvent, costRecord?: CostRecord): Promise<void>;
}
