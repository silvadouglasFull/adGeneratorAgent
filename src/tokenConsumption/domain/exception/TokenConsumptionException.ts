export class TokenConsumptionException extends Error {
    readonly originalError?: unknown;

    constructor(message: string, originalError?: unknown) {
        super(message);
        this.name = this.constructor.name;
        this.originalError = originalError;
        Object.setPrototypeOf(this, TokenConsumptionException.prototype);
    }
}
