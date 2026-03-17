import { TokenConsumptionRepositoryException } from "@/tokenConsumption/domain/exception/TokenConsumptionRepositoryException";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";
import { DrizzleTokenConsumptionRepository } from "@/tokenConsumption/infrastructure/persistence/DrizzleTokenConsumptionRepository";

const validRequestId = "550e8400-e29b-41d4-a716-446655440000";

function createEvent() {
    return TokenConsumptionEvent.create({
        requestId: validRequestId,
        modelUsed: "gpt-4o-mini",
        inputTokens: 100,
        outputTokens: 200,
        timestamp: new Date("2026-03-16T10:00:00.000Z"),
    });
}

describe("DrizzleTokenConsumptionRepository", () => {
    it("deve persistir evento com onConflictDoNothing", async () => {
        const onConflictDoNothing = jest.fn().mockResolvedValue(undefined);
        const values = jest.fn().mockReturnValue({ onConflictDoNothing });
        const insert = jest.fn().mockReturnValue({ values });

        const repository = new DrizzleTokenConsumptionRepository({
            insert,
            select: jest.fn(),
        } as any);

        await repository.save(createEvent());

        expect(insert).toHaveBeenCalled();
        expect(values).toHaveBeenCalled();
        expect(onConflictDoNothing).toHaveBeenCalled();
    });

    it("deve converter erro de save para TokenConsumptionRepositoryException", async () => {
        const onConflictDoNothing = jest.fn().mockRejectedValue(new Error("db error"));
        const values = jest.fn().mockReturnValue({ onConflictDoNothing });
        const insert = jest.fn().mockReturnValue({ values });

        const repository = new DrizzleTokenConsumptionRepository({
            insert,
            select: jest.fn(),
        } as any);

        await expect(repository.save(createEvent())).rejects.toThrow(TokenConsumptionRepositoryException);
    });

    it("deve retornar total por modelo", async () => {
        const where = jest.fn().mockResolvedValue([{ totalTokens: 777 }]);
        const from = jest.fn().mockReturnValue({ where });
        const select = jest.fn().mockReturnValue({ from });

        const repository = new DrizzleTokenConsumptionRepository({
            insert: jest.fn(),
            select,
        } as any);

        const total = await repository.getTotalTokensByModel("gpt-4o-mini");

        expect(total).toBe(777);
        expect(select).toHaveBeenCalled();
    });

    it("deve retornar null quando requestId não existe", async () => {
        const limit = jest.fn().mockResolvedValue([]);
        const where = jest.fn().mockReturnValue({ limit });
        const from = jest.fn().mockReturnValue({ where });
        const select = jest.fn().mockReturnValue({ from });

        const repository = new DrizzleTokenConsumptionRepository({
            insert: jest.fn(),
            select,
        } as any);

        const result = await repository.getByRequestId(validRequestId);

        expect(result).toBeNull();
    });

    it("deve retornar eventos com falha", async () => {
        const limit = jest.fn().mockResolvedValue([
            {
                requestId: "550e8400-e29b-41d4-a716-446655440001",
                modelUsed: "gpt-4o-mini",
                inputTokens: 30,
                outputTokens: 40,
                timestamp: new Date("2026-03-16T09:00:00.000Z"),
                status: "failed",
                errorMessage: "timeout",
            },
        ]);
        const orderBy = jest.fn().mockReturnValue({ limit });
        const where = jest.fn().mockReturnValue({ orderBy });
        const from = jest.fn().mockReturnValue({ where });
        const select = jest.fn().mockReturnValue({ from });

        const repository = new DrizzleTokenConsumptionRepository({
            insert: jest.fn(),
            select,
        } as any);

        const result = await repository.getFailedEvents(5);

        expect(result).toHaveLength(1);
        expect(result[0].status).toBe("failed");
        expect(result[0].errorMessage).toBe("timeout");
    });
});
