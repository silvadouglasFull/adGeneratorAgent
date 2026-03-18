import { SupportedModel } from "./SupportedModel";

export class AdGenerationRequest {
    readonly input: string;
    readonly instructions: string;
    readonly model: SupportedModel | undefined;
    readonly heliconeRequestId: string | undefined;

    private constructor(
        input: string,
        instructions: string,
        model?: SupportedModel,
        heliconeRequestId?: string
    ) {
        this.input = input;
        this.instructions = instructions;
        this.model = model;
        this.heliconeRequestId = heliconeRequestId;
    }

    static create(
        input: string,
        instructions: string,
        model?: SupportedModel,
        heliconeRequestId?: string
    ): AdGenerationRequest {
        if (!input || input.trim().length === 0) {
            throw new Error("Input não pode ser vazio");
        }
        if (!instructions || instructions.trim().length === 0) {
            throw new Error("Instructions não podem ser vazias");
        }
        return new AdGenerationRequest(input, instructions, model, heliconeRequestId);
    }
}
