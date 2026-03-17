import { QueueConsumerException } from "@/tokenConsumption/domain/exception/QueueConsumerException";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
import { RedisTokenConsumptionQueueProducer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueProducer";

describe("RedisTokenConsumptionQueueProducer", () => {
    const event = TokenConsumptionEvent.create({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        modelUsed: "gpt-4o-mini",
        inputTokens: 100,
        outputTokens: 200,
        timestamp: new Date("2026-03-16T10:00:00.000Z"),
    });

    it("deve enfileirar payload no Redis", async () => {
        const rpush = jest.fn().mockResolvedValue(1);
        const producer = new RedisTokenConsumptionQueueProducer({ rpush } as any);

        await producer.enqueue(event);

        expect(rpush).toHaveBeenCalledTimes(1);
        expect(rpush.mock.calls[0][0]).toBe("token_consumption:queue");

        const payload = JSON.parse(rpush.mock.calls[0][1]);
        expect(payload.retryCount).toBe(0);
        expect(payload.event.requestId).toBe(event.requestId);
        expect(payload.event.modelUsed).toBe("gpt-4o-mini");
    });

    it("deve lançar QueueConsumerException quando Redis falha", async () => {
        const rpush = jest.fn().mockRejectedValue(new Error("redis down"));
        const producer = new RedisTokenConsumptionQueueProducer({ rpush } as any);

        await expect(producer.enqueue(event)).rejects.toThrow(QueueConsumerException);
    });
});
