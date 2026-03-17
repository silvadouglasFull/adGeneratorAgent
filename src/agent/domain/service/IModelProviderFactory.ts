import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SupportedModel } from "../model/SupportedModel";

export interface IModelProviderFactory {
    create(model: SupportedModel, userId?: string): BaseChatModel;
}
