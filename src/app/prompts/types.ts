import { PromptType } from "@/prompts/domain/enum/PromptType";

export type UserPromptView = {
    id: string;
    userId: string;
    type: PromptType;
    content: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};
