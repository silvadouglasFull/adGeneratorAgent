import { TokenConsumptionException } from "./TokenConsumptionException";

export class InvalidTokenConsumptionEventException extends TokenConsumptionException {
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        Object.setPrototypeOf(this, InvalidTokenConsumptionEventException.prototype);
    }
}
