import { TokenConsumptionException } from "./TokenConsumptionException";

export class TokenConsumptionRepositoryException extends TokenConsumptionException {
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        Object.setPrototypeOf(this, TokenConsumptionRepositoryException.prototype);
    }
}
