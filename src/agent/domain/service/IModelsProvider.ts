import { ChatModel } from "../model/ChatModel";

export type ModelProviderName = "openai" | "google-gemini";

export interface IModelsProvider {
    readonly provider: ModelProviderName;
    getAvailableModels(apiKey: string): Promise<ChatModel[]>;
}
