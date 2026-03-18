import { CostRecordValidationException } from "@/tokenConsumption/domain/exception/CostRecordValidationException";
import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";

describe("CostRecord", () => {
    describe("create", () => {
        it("deve criar um CostRecord válido com custo calculado", () => {
            const record = CostRecord.create({
                costUSD: 0.01,
                exchangeRateAtExecution: 5.5,
                heliconeRequestId: "hel-123",
            });

            expect(record.costUSD).toBe(0.01);
            expect(record.costBRL).toBe(0.055);
            expect(record.exchangeRateAtExecution).toBe(5.5);
            expect(record.heliconeRequestId).toBe("hel-123");
        });

        it("deve arredondar costBRL a 6 casas decimais", () => {
            const record = CostRecord.create({
                costUSD: 0.0000069,
                exchangeRateAtExecution: 5.789123,
                heliconeRequestId: "hel-456",
            });

            expect(record.costBRL).toBe(
                Math.round(0.0000069 * 5.789123 * 1_000_000) / 1_000_000
            );
        });

        it("deve aceitar costUSD zero", () => {
            const record = CostRecord.create({
                costUSD: 0,
                exchangeRateAtExecution: 5.5,
                heliconeRequestId: null,
            });

            expect(record.costUSD).toBe(0);
            expect(record.costBRL).toBe(0);
        });

        it("deve lançar exceção quando costUSD é negativo", () => {
            expect(() =>
                CostRecord.create({
                    costUSD: -0.01,
                    exchangeRateAtExecution: 5.5,
                    heliconeRequestId: "hel-123",
                })
            ).toThrow(CostRecordValidationException);
        });

        it("deve lançar exceção quando exchangeRateAtExecution é negativo", () => {
            expect(() =>
                CostRecord.create({
                    costUSD: 0.01,
                    exchangeRateAtExecution: -1,
                    heliconeRequestId: "hel-123",
                })
            ).toThrow(CostRecordValidationException);
        });

        it("deve aceitar heliconeRequestId null", () => {
            const record = CostRecord.create({
                costUSD: 0.01,
                exchangeRateAtExecution: 5.5,
                heliconeRequestId: null,
            });

            expect(record.heliconeRequestId).toBeNull();
        });
    });

    describe("zero", () => {
        it("deve retornar record com todos os valores zerados", () => {
            const record = CostRecord.zero();

            expect(record.costUSD).toBe(0);
            expect(record.costBRL).toBe(0);
            expect(record.exchangeRateAtExecution).toBe(0);
            expect(record.heliconeRequestId).toBeNull();
        });
    });
});
