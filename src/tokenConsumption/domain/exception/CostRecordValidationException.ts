import { TokenConsumptionException } from "./TokenConsumptionException";

export class CostRecordValidationException extends TokenConsumptionException {
    constructor(message: string) {
        super(`CostRecord inválido: ${message}`);
        this.name = "CostRecordValidationException";
        Object.setPrototypeOf(this, CostRecordValidationException.prototype);
    }
}
