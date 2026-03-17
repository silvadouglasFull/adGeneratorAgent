export const SUPPORTED_MODELS = ["gpt-4o-mini", "gemini-2.0-flash", "gpt-image-1.5"] as const;
export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

export const TEXT_MODELS = ["gpt-4o-mini", "gemini-2.0-flash"] as const;
export type TextModel = (typeof TEXT_MODELS)[number];

export function isSupportedModel(value: unknown): value is SupportedModel {
    return typeof value === "string" && SUPPORTED_MODELS.includes(value as SupportedModel);
}

export function isTextModel(value: unknown): value is TextModel {
    return typeof value === "string" && (TEXT_MODELS as readonly string[]).includes(value);
}
