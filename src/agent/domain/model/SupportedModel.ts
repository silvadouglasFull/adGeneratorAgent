export const SUPPORTED_MODELS = ["gpt-4o-mini", "gemini-2.0-flash"] as const;
export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

export function isSupportedModel(value: unknown): value is SupportedModel {
    return typeof value === "string" && SUPPORTED_MODELS.includes(value as SupportedModel);
}
