import { ITokenConsumptionQueueProducer } from "@/tokenConsumption/application/service/ITokenConsumptionQueueProducer";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";

export class RecordTokenConsumptionUseCase {
    constructor(private readonly producer: ITokenConsumptionQueueProducer) { }

    async execute(event: TokenConsumptionEvent): Promise<void> {
        await this.producer.enqueue(event);
    }
}
