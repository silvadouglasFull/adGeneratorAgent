export type ChatModelProvider = "openai" | "google-gemini";

export type ChatModel = {
    name: string;
    provider: ChatModelProvider;
    isFree: boolean;
    isDefault?: boolean;
};
