import { ITokenConsumptionQueueProducer } from "@/tokenConsumption/application/service/ITokenConsumptionQueueProducer";
import { QueueConsumerException } from "@/tokenConsumption/domain/exception/QueueConsumerException";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
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
    };
    retryCount: number;
};

export class RedisTokenConsumptionQueueProducer implements ITokenConsumptionQueueProducer {
    static readonly QUEUE_KEY = "token_consumption:queue";

    constructor(private readonly redis: Redis = getRedisClient()) { }

    async enqueue(event: TokenConsumptionEvent): Promise<void> {
        const payload: QueuePayload = {
            event: {
                requestId: event.requestId,
                modelUsed: event.modelUsed,
                inputTokens: event.inputTokens,
                outputTokens: event.outputTokens,
                timestamp: event.timestamp.toISOString(),
                status: event.status,
                ...(event.errorMessage ? { errorMessage: event.errorMessage } : {}),
            },
            retryCount: 0,
        };

        try {
            await this.redis.rpush(
                RedisTokenConsumptionQueueProducer.QUEUE_KEY,
                JSON.stringify(payload)
            );
        } catch (error) {
            throw new QueueConsumerException("Erro ao enfileirar consumo de tokens", error);
        }
    }
}
