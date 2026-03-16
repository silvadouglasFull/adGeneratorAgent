import { RecordTokenConsumptionUseCase } from "@/tokenConsumption/application/usecase/RecordTokenConsumptionUseCase";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";

describe("RecordTokenConsumptionUseCase", () => {
    const event = TokenConsumptionEvent.create({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        modelUsed: "gpt-4o-mini",
        inputTokens: 120,
        outputTokens: 340,
        timestamp: new Date("2026-03-16T10:00:00.000Z"),
    });

    it("deve enfileirar evento usando o producer", async () => {
        const producer = {
            enqueue: jest.fn().mockResolvedValue(undefined),
        };

        const useCase = new RecordTokenConsumptionUseCase(producer);

        await useCase.execute(event);

        expect(producer.enqueue).toHaveBeenCalledTimes(1);
        expect(producer.enqueue).toHaveBeenCalledWith(event);
    });

    it("deve propagar erro do producer", async () => {
        const producer = {
            enqueue: jest.fn().mockRejectedValue(new Error("queue down")),
        };

        const useCase = new RecordTokenConsumptionUseCase(producer);

        await expect(useCase.execute(event)).rejects.toThrow("queue down");
    });
});
