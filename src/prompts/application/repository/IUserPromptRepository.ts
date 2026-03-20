import { CreateUserPromptDTO } from "@/prompts/application/dto/CreateUserPromptDTO";
import { UserPrompt } from "@/prompts/domain/entity/UserPrompt";
import { PromptType } from "@/prompts/domain/enum/PromptType";

export interface IUserPromptRepository {
    create(dto: CreateUserPromptDTO): Promise<UserPrompt>;
    findByUserIdAndType(userId: string, type: PromptType): Promise<UserPrompt | null>;
    findActiveByUserIdAndType(userId: string, type: PromptType): Promise<UserPrompt | null>;
    findAllByUserId(userId: string): Promise<UserPrompt[]>;
    findById(id: string): Promise<UserPrompt | null>;
    setActive(promptId: string): Promise<UserPrompt>;
    setInactive(promptId: string): Promise<UserPrompt>;
    update(id: string, content: string): Promise<UserPrompt>;
    delete(id: string): Promise<void>;
}
