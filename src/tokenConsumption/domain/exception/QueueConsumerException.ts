import { TokenConsumptionException } from "./TokenConsumptionException";

export class QueueConsumerException extends TokenConsumptionException {
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        Object.setPrototypeOf(this, QueueConsumerException.prototype);
    }
}
