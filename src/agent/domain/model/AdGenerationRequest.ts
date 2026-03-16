import { SupportedModel } from "./SupportedModel";

export class AdGenerationRequest {
    readonly input: string;
    readonly instructions: string;
    readonly model: SupportedModel | undefined;

    private constructor(input: string, instructions: string, model?: SupportedModel) {
        this.input = input;
        this.instructions = instructions;
        this.model = model;
    }

    static create(input: string, instructions: string, model?: SupportedModel): AdGenerationRequest {
        if (!input || input.trim().length === 0) {
            throw new Error("Input não pode ser vazio");
        }
        if (!instructions || instructions.trim().length === 0) {
            throw new Error("Instructions não podem ser vazias");
        }
        return new AdGenerationRequest(input, instructions, model);
    }
}
