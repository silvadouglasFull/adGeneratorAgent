import { DomainException } from "./DomainException";

export class ModelCatalogProviderException extends DomainException {
    readonly originalError?: unknown;

    constructor(message: string, originalError?: unknown) {
        super(message);
        this.originalError = originalError;
        Object.setPrototypeOf(this, ModelCatalogProviderException.prototype);
    }
}
