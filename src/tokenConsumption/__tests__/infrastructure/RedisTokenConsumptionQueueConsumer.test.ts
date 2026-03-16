import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
import { RedisTokenConsumptionQueueConsumer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueConsumer";

describe("RedisTokenConsumptionQueueConsumer", () => {
    const validPayload = JSON.stringify({
        event: {
            requestId: "550e8400-e29b-41d4-a716-446655440001",
            modelUsed: "gpt-4o-mini",
            inputTokens: 120,
            outputTokens: 80,
            timestamp: "2026-03-16T10:00:00.000Z",
            status: "success",
        },
        retryCount: 0,
    });

    it("deve processar payload válido e salvar no repositório", async () => {
        const repository = { save: jest.fn().mockResolvedValue(undefined) };
        const redis = { rpush: jest.fn(), blpop: jest.fn() };

        const consumer = new RedisTokenConsumptionQueueConsumer(
            redis as any,
            repository as any,
            3,
            1
        );

        await consumer.handleRawPayload(validPayload);

        expect(repository.save).toHaveBeenCalledTimes(1);
        const savedEvent = repository.save.mock.calls[0][0] as TokenConsumptionEvent;
        expect(savedEvent.requestId).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("deve enviar payload inválido para DLQ", async () => {
        const repository = { save: jest.fn().mockResolvedValue(undefined) };
        const redis = { rpush: jest.fn().mockResolvedValue(1), blpop: jest.fn() };

        const consumer = new RedisTokenConsumptionQueueConsumer(
            redis as any,
            repository as any,
            3,
            1
        );

        await expect(consumer.handleRawPayload("json invalido")).rejects.toThrow();
        expect(redis.rpush).toHaveBeenCalledWith(
            "token_consumption:dlq",
            expect.any(String)
        );
    });

    it("deve reenfileirar com retry quando save falha", async () => {
        const repository = { save: jest.fn().mockRejectedValue(new Error("db down")) };
        const redis = { rpush: jest.fn().mockResolvedValue(1), blpop: jest.fn() };

        const consumer = new RedisTokenConsumptionQueueConsumer(
            redis as any,
            repository as any,
            3,
            1
        );

        await consumer.handleRawPayload(validPayload);

        expect(redis.rpush).toHaveBeenCalledWith(
            "token_consumption:queue",
            expect.any(String)
        );
        const message = JSON.parse(redis.rpush.mock.calls[0][1]);
        expect(message.retryCount).toBe(1);
    });

    it("deve mover para DLQ quando atingir max retries", async () => {
        const repository = { save: jest.fn().mockRejectedValue(new Error("db down")) };
        const redis = { rpush: jest.fn().mockResolvedValue(1), blpop: jest.fn() };
        const payload = JSON.stringify({
            event: {
                requestId: "550e8400-e29b-41d4-a716-446655440002",
                modelUsed: "gemini-2.0-flash",
                inputTokens: 90,
                outputTokens: 110,
                timestamp: "2026-03-16T10:00:00.000Z",
                status: "success",
            },
            retryCount: 3,
        });

        const consumer = new RedisTokenConsumptionQueueConsumer(
            redis as any,
            repository as any,
            3,
            1
        );

        await consumer.handleRawPayload(payload);

        expect(redis.rpush).toHaveBeenCalledWith(
            "token_consumption:dlq",
            expect.any(String)
        );
    });
});
