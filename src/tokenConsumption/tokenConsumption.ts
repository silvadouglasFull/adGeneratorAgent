import { RecordTokenConsumptionUseCase } from "@/tokenConsumption/application/usecase/RecordTokenConsumptionUseCase";
import { DrizzleTokenConsumptionRepository } from "@/tokenConsumption/infrastructure/persistence/DrizzleTokenConsumptionRepository";
import { RedisTokenConsumptionQueueConsumer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueConsumer";
import { RedisTokenConsumptionQueueProducer } from "@/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueProducer";

const repository = new DrizzleTokenConsumptionRepository();
const producer = new RedisTokenConsumptionQueueProducer();
const consumer = new RedisTokenConsumptionQueueConsumer(undefined, repository);
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
};
