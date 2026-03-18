import { CostCaptureService } from "@/tokenConsumption/application/service/CostCaptureService";
import { RecordTokenConsumptionUseCase } from "@/tokenConsumption/application/usecase/RecordTokenConsumptionUseCase";
import { DrizzleTokenConsumptionRepository } from "@/tokenConsumption/infrastructure/persistence/DrizzleTokenConsumptionRepository";
import { ExchangeRateAdapter } from "@/tokenConsumption/infrastructure/providers/ExchangeRateAdapter";
import { HeliconeCostAdapter } from "@/tokenConsumption/infrastructure/providers/HeliconeCostAdapter";
import { RedisTokenConsumptionQueueConsumer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueConsumer";
import { RedisTokenConsumptionQueueProducer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueProducer";

const repository = new DrizzleTokenConsumptionRepository();
const producer = new RedisTokenConsumptionQueueProducer();
const heliconeCostAdapter = new HeliconeCostAdapter();
const exchangeRateAdapter = new ExchangeRateAdapter();
const costCaptureService = new CostCaptureService(heliconeCostAdapter, exchangeRateAdapter);
const consumer = new RedisTokenConsumptionQueueConsumer(
    undefined,
    repository,
    3,
    1000,
    costCaptureService
);
const useCase = new RecordTokenConsumptionUseCase(producer);

let consumerStarted = false;

export async function ensureTokenConsumptionConsumerStarted(): Promise<void> {
    if (consumerStarted) {
        return;
    }

    await consumer.start();
    consumerStarted = true;
}

export const tokenConsumptionContainer = {
    repository,
    producer,
    consumer,
    useCase,
    costCaptureService,
};
