import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SupportedModel } from "../model/SupportedModel";
import { ModelProviderOptions } from "./IModelProviderFactory";

export interface ILiteLLMProxyProvider {
    create(model: SupportedModel, options?: ModelProviderOptions): BaseChatModel;
    isAvailable(): Promise<boolean>;
}
