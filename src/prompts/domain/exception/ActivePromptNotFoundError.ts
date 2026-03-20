import { PromptType } from "@/prompts/domain/enum/PromptType";

export class ActivePromptNotFoundError extends Error {
    constructor(type: PromptType) {
        super(
            `Nenhum prompt ativo de tipo ${type} encontrado para o usuário. Crie e ative um prompt.`
        );
        this.name = "ActivePromptNotFoundError";
    }
}
