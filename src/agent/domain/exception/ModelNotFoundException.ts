import { DomainException } from "./DomainException";

export class ModelNotFoundException extends DomainException {
    constructor(modelName: string, supportedModels: string[]) {
        super(
            `Modelo "${modelName}" não configurado. Modelos suportados: ${supportedModels.join(", ")}`
        );
        Object.setPrototypeOf(this, ModelNotFoundException.prototype);
    }
}
