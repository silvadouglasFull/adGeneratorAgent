import { CostCaptureService } from "@/tokenConsumption/application/service/CostCaptureService";
import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
import { IExchangeRateAdapter } from "@/tokenConsumption/domain/service/IExchangeRateAdapter";
import { IHeliconeCostAdapter } from "@/tokenConsumption/domain/service/IHeliconeCostAdapter";
import { ITokenConsumptionRepository } from "@/tokenConsumption/domain/service/ITokenConsumptionRepository";
import { RedisTokenConsumptionQueueConsumer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueConsumer";
import { RedisTokenConsumptionQueueProducer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueProducer";

describe("CostCapturePipeline (integration)", () => {
    let mockRedis: {
        rpush: jest.Mock;
        blpop: jest.Mock;
        quit: jest.Mock;
    };
    let mockRepository: jest.Mocked<ITokenConsumptionRepository>;
    let heliconeCostAdapter: jest.Mocked<IHeliconeCostAdapter>;
    let exchangeRateAdapter: jest.Mocked<IExchangeRateAdapter>;
    let costCaptureService: CostCaptureService;

    beforeEach(() => {
        mockRedis = {
            rpush: jest.fn().mockResolvedValue(1),
            blpop: jest.fn().mockResolvedValue(null),
            quit: jest.fn().mockResolvedValue("OK"),
        };

        mockRepository = {
            save: jest.fn().mockResolvedValue(undefined),
            getTotalTokensByModel: jest.fn(),
            getTotalTokensByPeriod: jest.fn(),
            getByRequestId: jest.fn(),
            getFailedEvents: jest.fn(),
        };

        heliconeCostAdapter = {
            getCostByRequestId: jest.fn(),
        };

        exchangeRateAdapter = {
            getUSDtoBRL: jest.fn(),
        };

        costCaptureService = new CostCaptureService(
            heliconeCostAdapter,
            exchangeRateAdapter
        );
    });

    it("pipeline completo: evento enfileirado → consumer processa → custo capturado → persistido", async () => {
        heliconeCostAdapter.getCostByRequestId.mockResolvedValue(0.0001);
        exchangeRateAdapter.getUSDtoBRL.mockResolvedValue(5.5);

        const event = TokenConsumptionEvent.create({
            requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            modelUsed: "gpt-4o-mini",
            inputTokens: 100,
            outputTokens: 200,
            heliconeRequestId: "hel-integration-test",
        });

        const producer = new RedisTokenConsumptionQueueProducer(mockRedis as never);
        await producer.enqueue(event);

        expect(mockRedis.rpush).toHaveBeenCalledTimes(1);
        const queuedPayloadStr = mockRedis.rpush.mock.calls[0][1];
        const queuedPayload = JSON.parse(queuedPayloadStr);

        expect(queuedPayload.event.heliconeRequestId).toBe("hel-integration-test");

        const consumer = new RedisTokenConsumptionQueueConsumer(
            mockRedis as never,
            mockRepository,
            3,
            1000,
            costCaptureService
        );

        await consumer.handleRawPayload(queuedPayloadStr);

        expect(heliconeCostAdapter.getCostByRequestId).toHaveBeenCalledWith("hel-integration-test");
        expect(exchangeRateAdapter.getUSDtoBRL).toHaveBeenCalledTimes(1);
        expect(mockRepository.save).toHaveBeenCalledTimes(1);

        const savedEvent = mockRepository.save.mock.calls[0][0];
        const savedCostRecord = mockRepository.save.mock.calls[0][1] as CostRecord;

        expect(savedEvent.requestId).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
        expect(savedCostRecord.costUSD).toBe(0.0001);
        expect(savedCostRecord.costBRL).toBeGreaterThan(0);
        expect(savedCostRecord.heliconeRequestId).toBe("hel-integration-test");
    });

    it("deve persistir com costUSD=0 quando heliconeRequestId é null", async () => {
        const event = TokenConsumptionEvent.create({
            requestId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            modelUsed: "gemini-2.0-flash",
            inputTokens: 50,
            outputTokens: 100,
        });

        const producer = new RedisTokenConsumptionQueueProducer(mockRedis as never);
        await producer.enqueue(event);

        const queuedPayloadStr = mockRedis.rpush.mock.calls[0][1];

        const consumer = new RedisTokenConsumptionQueueConsumer(
            mockRedis as never,
            mockRepository,
            3,
            1000,
            costCaptureService
        );

        await consumer.handleRawPayload(queuedPayloadStr);

        expect(heliconeCostAdapter.getCostByRequestId).not.toHaveBeenCalled();
        expect(mockRepository.save).toHaveBeenCalledTimes(1);

        const savedCostRecord = mockRepository.save.mock.calls[0][1];
        expect(savedCostRecord).toBeUndefined();
    });

    it("deve persistir evento mesmo quando CostCaptureService falha", async () => {
        heliconeCostAdapter.getCostByRequestId.mockRejectedValue(new Error("Helicone down"));
        exchangeRateAdapter.getUSDtoBRL.mockRejectedValue(new Error("Exchange API down"));

        const event = TokenConsumptionEvent.create({
            requestId: "c3d4e5f6-a7b8-1012-abcd-123456789012",
            modelUsed: "gpt-4o-mini",
            inputTokens: 200,
            outputTokens: 400,
            heliconeRequestId: "hel-fail-test",
        });

        const producer = new RedisTokenConsumptionQueueProducer(mockRedis as never);
        await producer.enqueue(event);

        const queuedPayloadStr = mockRedis.rpush.mock.calls[0][1];

        const consumer = new RedisTokenConsumptionQueueConsumer(
            mockRedis as never,
            mockRepository,
            3,
            1000,
            costCaptureService
        );

        await consumer.handleRawPayload(queuedPayloadStr);

        expect(mockRepository.save).toHaveBeenCalledTimes(1);

        const savedCostRecord = mockRepository.save.mock.calls[0][1] as CostRecord;
        expect(savedCostRecord.costUSD).toBe(0);
        expect(savedCostRecord.costBRL).toBe(0);
    });
});
