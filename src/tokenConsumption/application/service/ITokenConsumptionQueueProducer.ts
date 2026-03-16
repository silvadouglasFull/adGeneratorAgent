import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";

export interface ITokenConsumptionQueueProducer {
    enqueue(event: TokenConsumptionEvent): Promise<void>;
}
