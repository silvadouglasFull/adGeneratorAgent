import { SupportedModel, isSupportedModel } from "@/agent/domain/model/SupportedModel";
import { InvalidTokenConsumptionEventException } from "../exception/InvalidTokenConsumptionEventException";

export type TokenConsumptionStatus = "success" | "failed";

type CreateTokenConsumptionEventParams = {
    requestId: string;
    modelUsed: SupportedModel;
    inputTokens: number;
    outputTokens: number;
    timestamp?: Date;
    status?: TokenConsumptionStatus;
    errorMessage?: string;
    heliconeRequestId?: string;
    userId?: string;
};

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TokenConsumptionEvent {
    readonly requestId: string;
    readonly modelUsed: SupportedModel;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly totalTokens: number;
    readonly timestamp: Date;
    readonly status: TokenConsumptionStatus;
    readonly errorMessage?: string;
    readonly heliconeRequestId?: string;
    readonly userId?: string;

    private constructor(
        requestId: string,
        modelUsed: SupportedModel,
        inputTokens: number,
        outputTokens: number,
        timestamp: Date,
        status: TokenConsumptionStatus,
        errorMessage?: string,
        heliconeRequestId?: string,
        userId?: string
    ) {
        this.requestId = requestId;
        this.modelUsed = modelUsed;
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
        this.totalTokens = inputTokens + outputTokens;
        this.timestamp = timestamp;
        this.status = status;
        this.errorMessage = errorMessage;
        this.heliconeRequestId = heliconeRequestId;
        this.userId = userId;
    }

    static create(params: CreateTokenConsumptionEventParams): TokenConsumptionEvent {
        const {
            requestId,
            modelUsed,
            inputTokens,
            outputTokens,
            timestamp = new Date(),
            status = "success",
            errorMessage,
            heliconeRequestId,
            userId,
        } = params;

        if (!UUID_REGEX.test(requestId)) {
            throw new InvalidTokenConsumptionEventException("requestId deve ser um UUID válido");
        }

        if (!isSupportedModel(modelUsed)) {
            throw new InvalidTokenConsumptionEventException("modelUsed não é suportado");
        }

        if (!Number.isInteger(inputTokens) || inputTokens <= 0) {
            throw new InvalidTokenConsumptionEventException("inputTokens deve ser inteiro maior que zero");
        }

        if (!Number.isInteger(outputTokens) || outputTokens <= 0) {
            throw new InvalidTokenConsumptionEventException("outputTokens deve ser inteiro maior que zero");
        }

        if (!(timestamp instanceof Date) || Number.isNaN(timestamp.getTime())) {
            throw new InvalidTokenConsumptionEventException("timestamp deve ser uma data válida");
        }

        if (timestamp.getTime() > Date.now()) {
            throw new InvalidTokenConsumptionEventException("timestamp não pode estar no futuro");
        }

        if (status === "failed" && (!errorMessage || errorMessage.trim().length === 0)) {
            throw new InvalidTokenConsumptionEventException(
                "errorMessage é obrigatório quando status é failed"
            );
        }

        return new TokenConsumptionEvent(
            requestId,
            modelUsed,
            inputTokens,
            outputTokens,
            timestamp,
            status,
            errorMessage,
            heliconeRequestId,
            userId
        );
    }

    equals(other: TokenConsumptionEvent): boolean {
        return (
            this.requestId === other.requestId &&
            this.modelUsed === other.modelUsed &&
            this.inputTokens === other.inputTokens &&
            this.outputTokens === other.outputTokens &&
            this.timestamp.getTime() === other.timestamp.getTime() &&
            this.status === other.status &&
            this.errorMessage === other.errorMessage
        );
    }

    toString(): string {
        return [
            `TokenConsumptionEvent(${this.requestId})`,
            `model=${this.modelUsed}`,
            `input=${this.inputTokens}`,
            `output=${this.outputTokens}`,
            `total=${this.totalTokens}`,
            `status=${this.status}`,
        ].join(" ");
    }
}
