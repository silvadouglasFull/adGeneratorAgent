import { PromptType } from "@/prompts/domain/enum/PromptType";

type UserPromptProps = {
    id: string;
    userId: string;
    type: PromptType;
    content: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export class UserPrompt {
    readonly id: string;
    readonly userId: string;
    readonly type: PromptType;
    content: string;
    isActive: boolean;
    readonly createdAt: Date;
    updatedAt: Date;

    constructor(props: UserPromptProps) {
        this.id = props.id;
        this.userId = props.userId;
        this.type = props.type;
        this.content = props.content;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    setActive(): void {
        this.isActive = true;
    }

    setInactive(): void {
        this.isActive = false;
    }

    updateContent(content: string): void {
        this.content = content;
    }

    touchUpdatedAt(updatedAt: Date): void {
        this.updatedAt = updatedAt;
    }
}
