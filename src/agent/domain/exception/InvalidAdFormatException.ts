import { DomainException } from "./DomainException";

export class InvalidAdFormatException extends DomainException {
    constructor() {
        super("Output inválido: o anúncio gerado não está em formato Markdown válido.");
        Object.setPrototypeOf(this, InvalidAdFormatException.prototype);
    }
}
