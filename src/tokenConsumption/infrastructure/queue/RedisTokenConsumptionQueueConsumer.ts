import { CostCaptureService } from "@/tokenConsumption/application/service/CostCaptureService";
import { ITokenConsumptionQueueConsumer } from "@/tokenConsumption/application/service/ITokenConsumptionQueueConsumer";
import { QueueConsumerException } from "@/tokenConsumption/domain/exception/QueueConsumerException";
import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
import { ITokenConsumptionRepository } from "@/tokenConsumption/domain/service/ITokenConsumptionRepository";
import Redis from "ioredis";
import { getRedisClient } from "./redis-client";

type QueuePayload = {
    event: {
        requestId: string;
        modelUsed: string;
        inputTokens: number;
        outputTokens: number;
        timestamp: string;
        status: "success" | "failed";
        errorMessage?: string;
        heliconeRequestId?: string;
        userId?: string;
    };
    retryCount?: number;
};

export class RedisTokenConsumptionQueueConsumer implements ITokenConsumptionQueueConsumer {
    static readonly QUEUE_KEY = "token_consumption:queue";
    static readonly DLQ_KEY = "token_consumption:dlq";

    private isRunning = false;
    private loopPromise: Promise<void> | null = null;

    constructor(
        private readonly redis: Redis = getRedisClient(),
        private readonly repository: ITokenConsumptionRepository,
        private readonly maxRetries = 3,
        private readonly baseDelayMs = 1000,
        private readonly costCaptureService?: CostCaptureService
    ) { }

    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.loopPromise = this.consumeLoop();
    }

    async stop(): Promise<void> {
        this.isRunning = false;

        if (this.loopPromise) {
            await this.loopPromise;
            this.loopPromise = null;
        }
    }

    async process(event: TokenConsumptionEvent, costRecord?: CostRecord): Promise<void> {
        await this.repository.save(event, costRecord);
    }

    async handleRawPayload(rawPayload: string): Promise<void> {
        let payload: QueuePayload;

        try {
            payload = JSON.parse(rawPayload) as QueuePayload;
        } catch (error) {
            await this.moveToDlq(rawPayload, 0, "payload inválido");
            throw new QueueConsumerException("Payload inválido na fila", error);
        }

        const retryCount = payload.retryCount ?? 0;

        try {
            const event = TokenConsumptionEvent.create({
                requestId: payload.event.requestId,
                modelUsed: payload.event.modelUsed as TokenConsumptionEvent["modelUsed"],
                inputTokens: payload.event.inputTokens,
                outputTokens: payload.event.outputTokens,
                timestamp: new Date(payload.event.timestamp),
                status: payload.event.status,
                errorMessage: payload.event.errorMessage,
                heliconeRequestId: payload.event.heliconeRequestId,
                userId: payload.event.userId,
            });

            let costRecord: CostRecord | undefined;
            if (event.heliconeRequestId && this.costCaptureService) {
                costRecord = await this.costCaptureService.capture(event.heliconeRequestId);
            }

            await this.process(event, costRecord);
        } catch (error) {
            await this.retryOrDlq(payload, retryCount, error);
        }
    }

    private async consumeLoop(): Promise<void> {
        while (this.isRunning) {
            try {
                const result = await this.redis.blpop(
                    RedisTokenConsumptionQueueConsumer.QUEUE_KEY,
                    1
                );

                if (!result || result.length < 2) {
                    continue;
                }

                const rawPayload = result[1];
                await this.handleRawPayload(rawPayload);
            } catch (error) {
                console.error("Erro no loop de consumo da fila", error);
            }
        }
    }

    private async retryOrDlq(
        payload: QueuePayload,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const nextRetry = retryCount + 1;

        if (nextRetry > this.maxRetries) {
            await this.moveToDlq(JSON.stringify(payload), retryCount, this.errorMessage(error));
            return;
        }

        const delayMs = this.baseDelayMs * Math.pow(2, retryCount);
        await this.delay(delayMs);

        await this.redis.rpush(
            RedisTokenConsumptionQueueConsumer.QUEUE_KEY,
            JSON.stringify({ ...payload, retryCount: nextRetry })
        );
    }

    private async moveToDlq(rawPayload: string, retryCount: number, reason: string): Promise<void> {
        await this.redis.rpush(
            RedisTokenConsumptionQueueConsumer.DLQ_KEY,
            JSON.stringify({ rawPayload, retryCount, reason, movedAt: new Date().toISOString() })
        );
    }

    private errorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        return "erro desconhecido";
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
