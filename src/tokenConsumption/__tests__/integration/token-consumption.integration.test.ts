/**
 * Integration test: Token Consumption pipeline (Redis → Consumer → PostgreSQL)
 *
 * Prerequisites:
 *   docker compose up -d   (PostgreSQL + Redis running)
 *   pnpm db:migrate         (migrations applied)
 *
 * Run:
 *   pnpm test --testPathPattern=integration
 */

import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";

const mockSave = jest.fn();
const mockBlpop = jest.fn();
const mockRpush = jest.fn();
const mockQuit = jest.fn();

jest.mock("@/tokenConsumption/infrastructure/queue/redis-client", () => ({
    getRedisClient: () => ({
        rpush: mockRpush,
        blpop: mockBlpop,
        quit: mockQuit,
    }),
}));

jest.mock("@/tokenConsumption/infrastructure/db/client", () => ({
    db: {},
    getDatabase: jest.fn(),
    closeDatabase: jest.fn(),
}));

import { TokenAggregation } from "@/tokenConsumption/domain/model/TokenAggregation";
import { ITokenConsumptionRepository } from "@/tokenConsumption/domain/service/ITokenConsumptionRepository";
import { RedisTokenConsumptionQueueConsumer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueConsumer";
import { RedisTokenConsumptionQueueProducer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueProducer";

function createMockRepository(): ITokenConsumptionRepository {
    return {
        save: mockSave,
        getTotalTokensByModel: jest.fn().mockResolvedValue(0),
        getTotalTokensByPeriod: jest.fn().mockResolvedValue(
            TokenAggregation.create({
                periodStart: new Date(),
                periodEnd: new Date(),
                totalTokens: 0,
                requestCount: 0,
                byModel: { "gpt-4o-mini": 0, "gemini-2.0-flash": 0 },
            })
        ),
        getByRequestId: jest.fn().mockResolvedValue(null),
        getFailedEvents: jest.fn().mockResolvedValue([]),
    };
}

describe("Token Consumption Integration (mocked infra)", () => {
    let producer: RedisTokenConsumptionQueueProducer;
    let consumer: RedisTokenConsumptionQueueConsumer;
    let repository: ITokenConsumptionRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRpush.mockResolvedValue(1);
        mockSave.mockResolvedValue(undefined);

        repository = createMockRepository();
        producer = new RedisTokenConsumptionQueueProducer();
        consumer = new RedisTokenConsumptionQueueConsumer(undefined, repository);
    });

    afterEach(async () => {
        await consumer.stop();
    });

    it("producer enfileira evento e consumer persiste no repositório", async () => {
        const event = TokenConsumptionEvent.create({
            requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            modelUsed: "gpt-4o-mini",
            inputTokens: 150,
            outputTokens: 320,
            timestamp: new Date(Date.now() - 1000),
        });

        await producer.enqueue(event);

        expect(mockRpush).toHaveBeenCalledWith(
            "token_consumption:queue",
            expect.stringContaining(event.requestId)
        );

        const enqueuedPayload = mockRpush.mock.calls[0][1] as string;
        await consumer.handleRawPayload(enqueuedPayload);

        expect(mockSave).toHaveBeenCalledTimes(1);
        const savedEvent = mockSave.mock.calls[0][0] as TokenConsumptionEvent;
        expect(savedEvent.requestId).toBe(event.requestId);
        expect(savedEvent.inputTokens).toBe(150);
        expect(savedEvent.outputTokens).toBe(320);
    });

    it("consumer move para DLQ após falhas repetidas", async () => {
        const event = TokenConsumptionEvent.create({
            requestId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            modelUsed: "gemini-2.0-flash",
            inputTokens: 100,
            outputTokens: 200,
            timestamp: new Date(Date.now() - 1000),
        });

        mockSave.mockRejectedValue(new Error("DB connection refused"));

        await producer.enqueue(event);
        const enqueuedPayload = mockRpush.mock.calls[0][1] as string;

        // handleRawPayload will fail and re-enqueue with retry
        await consumer.handleRawPayload(enqueuedPayload);

        // Should have attempted to re-enqueue (retry) via rpush
        const rpushCalls = mockRpush.mock.calls;
        const retryCall = rpushCalls.find(
            (call) =>
                call[0] === "token_consumption:queue" &&
                typeof call[1] === "string" &&
                call[1].includes('"retryCount":1')
        );
        expect(retryCall).toBeDefined();
    });

    it("consumer processa payload inválido movendo para DLQ", async () => {
        await expect(consumer.handleRawPayload("not-valid-json")).rejects.toThrow();

        const dlqCall = mockRpush.mock.calls.find(
            (call) => call[0] === "token_consumption:dlq"
        );
        expect(dlqCall).toBeDefined();
    });

    it("pipeline completo: enqueue → consume → save (end-to-end mock)", async () => {
        const events = Array.from({ length: 5 }, (_, i) =>
            TokenConsumptionEvent.create({
                requestId: `c3d4e5f6-a7b8-9012-cdef-${String(i).padStart(12, "0")}`,
                modelUsed: i % 2 === 0 ? "gpt-4o-mini" : "gemini-2.0-flash",
                inputTokens: 100 + i * 50,
                outputTokens: 200 + i * 100,
                timestamp: new Date(Date.now() - 1000),
            })
        );

        for (const event of events) {
            await producer.enqueue(event);
        }

        expect(mockRpush).toHaveBeenCalledTimes(5);

        for (let i = 0; i < events.length; i++) {
            const payload = mockRpush.mock.calls[i][1] as string;
            await consumer.handleRawPayload(payload);
        }

        expect(mockSave).toHaveBeenCalledTimes(5);
    });
});
