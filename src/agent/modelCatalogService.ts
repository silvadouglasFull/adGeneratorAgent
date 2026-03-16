import { ModelCatalogService } from "@/agent/application/service/ModelCatalogService";
import { IModelCatalogService } from "@/agent/domain/service/IModelCatalogService";
import { GoogleModelsProvider } from "@/agent/infrastructure/providers/GoogleModelsProvider";
import { OpenAIModelsProvider } from "@/agent/infrastructure/providers/OpenAIModelsProvider";
import { UserApiKeyRepository } from "@/agent/infrastructure/repository/UserApiKeyRepository";

const openAIProvider = new OpenAIModelsProvider();
const googleProvider = new GoogleModelsProvider();
const apiKeyRepository = new UserApiKeyRepository();

export const modelCatalogService: IModelCatalogService = new ModelCatalogService(
    [openAIProvider, googleProvider],
    apiKeyRepository
);
