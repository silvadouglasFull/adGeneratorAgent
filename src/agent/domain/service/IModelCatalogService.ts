import { ChatModel } from "../model/ChatModel";

export interface IModelCatalogService {
    getAvailableModels(userId: string): Promise<ChatModel[]>;
    getFreeModels(userId: string): Promise<ChatModel[]>;
    getModelInfo(modelName: string, userId: string): Promise<ChatModel | undefined>;
}
