import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SupportedModel } from "../model/SupportedModel";

export type ModelProviderOptions = {
    userId?: string;
    heliconeRequestId?: string;
};

export interface IModelProviderFactory {
    create(model: SupportedModel, options?: ModelProviderOptions): BaseChatModel;
}
