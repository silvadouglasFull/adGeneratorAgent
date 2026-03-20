const IMAGE_KEYWORDS = [
    "imagem",
    "imagen",
    "image",
    "foto",
    "photo",
    "visual",
    "picture",
    "gere uma imagem",
    "crie uma imagem",
    "gerar imagem",
    "com imagem",
    "com foto",
];

const TEXT_KEYWORDS = [
    "texto",
    "anuncio",
    "anúncio",
    "descrição",
    "descricao",
    "campanha",
    "copy",
    "legenda",
    "headline",
    "gerar texto",
    "crie um texto",
];

export enum PromptIntentType {
    TEXT_GENERATION = "TEXT_GENERATION",
    IMAGE_GENERATION = "IMAGE_GENERATION",
    BOTH = "BOTH",
}

export class ImageIntentDetector {
    detect(input: string): PromptIntentType {
        const normalized = input.toLowerCase().trim();

        if (!normalized) {
            return PromptIntentType.TEXT_GENERATION;
        }

        const hasImageIntent = IMAGE_KEYWORDS.some((keyword) => normalized.includes(keyword));
        const hasTextIntent = TEXT_KEYWORDS.some((keyword) => normalized.includes(keyword));

        if (hasImageIntent && hasTextIntent) {
            return PromptIntentType.BOTH;
        }

        if (hasImageIntent) {
            return PromptIntentType.IMAGE_GENERATION;
        }

        return PromptIntentType.TEXT_GENERATION;
    }

    requiresImage(input: string): boolean {
        const intent = this.detect(input);
        return intent === PromptIntentType.IMAGE_GENERATION || intent === PromptIntentType.BOTH;
    }

    requiresText(input: string): boolean {
        const intent = this.detect(input);
        return intent === PromptIntentType.TEXT_GENERATION || intent === PromptIntentType.BOTH;
    }
}
