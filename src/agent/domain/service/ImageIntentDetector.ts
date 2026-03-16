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

export class ImageIntentDetector {
    detect(input: string): boolean {
        const normalized = input.toLowerCase().trim();

        if (!normalized) {
            return false;
        }

        return IMAGE_KEYWORDS.some((keyword) => normalized.includes(keyword));
    }
}
