import { DomainException } from "./DomainException";

export class ImageGenerationException extends DomainException {
    constructor(reason: string) {
        super(`Falha ao gerar imagem: ${reason}`);
        Object.setPrototypeOf(this, ImageGenerationException.prototype);
    }
}
