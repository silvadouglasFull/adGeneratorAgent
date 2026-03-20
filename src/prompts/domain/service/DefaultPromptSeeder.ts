import { CreateUserPromptDTO } from "@/prompts/application/dto/CreateUserPromptDTO";
import { IUserPromptRepository } from "@/prompts/application/repository/IUserPromptRepository";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import {
    DEFAULT_IMAGE_GENERATION_PROMPT,
    DEFAULT_TEXT_GENERATION_PROMPT,
} from "@/prompts/domain/seed/defaultPromptContents";

const DEFAULT_SEEDS: Array<{ type: PromptType; content: string }> = [
    { type: PromptType.TEXT_GENERATION, content: DEFAULT_TEXT_GENERATION_PROMPT },
    { type: PromptType.IMAGE_GENERATION, content: DEFAULT_IMAGE_GENERATION_PROMPT },
];

export class DefaultPromptSeeder {
    constructor(private readonly repository: IUserPromptRepository) { }

    async seedForUser(userId: string): Promise<void> {
        for (const seed of DEFAULT_SEEDS) {
            const existing = await this.repository.findByUserIdAndType(userId, seed.type);

            if (existing) {
                continue;
            }

            const dto: CreateUserPromptDTO = {
                userId,
                type: seed.type,
                content: seed.content,
                isActive: true,
            };

            await this.repository.create(dto);
        }
    }
}
