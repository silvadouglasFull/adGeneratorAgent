import { InvalidTokenConsumptionEventException } from "@/tokenConsumption/domain/exception/InvalidTokenConsumptionEventException";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";

describe("TokenConsumptionEvent", () => {
    const validRequestId = "550e8400-e29b-41d4-a716-446655440000";

    it("deve criar evento válido", () => {
        const event = TokenConsumptionEvent.create({
            requestId: validRequestId,
            modelUsed: "gpt-4o-mini",
            inputTokens: 120,
            outputTokens: 240,
        });

        expect(event.requestId).toBe(validRequestId);
        expect(event.modelUsed).toBe("gpt-4o-mini");
        expect(event.totalTokens).toBe(360);
        expect(event.status).toBe("success");
    });

    it("deve lançar erro para requestId inválido", () => {
        expect(() => {
            TokenConsumptionEvent.create({
                requestId: "invalido",
                modelUsed: "gpt-4o-mini",
                inputTokens: 120,
                outputTokens: 240,
            });
        }).toThrow(InvalidTokenConsumptionEventException);
    });

    it("deve lançar erro para inputTokens inválido", () => {
        expect(() => {
            TokenConsumptionEvent.create({
                requestId: validRequestId,
                modelUsed: "gpt-4o-mini",
                inputTokens: 0,
                outputTokens: 240,
            });
        }).toThrow("inputTokens deve ser inteiro maior que zero");
    });

    it("deve exigir errorMessage quando status for failed", () => {
        expect(() => {
            TokenConsumptionEvent.create({
                requestId: validRequestId,
                modelUsed: "gemini-2.0-flash",
                inputTokens: 100,
                outputTokens: 200,
                status: "failed",
            });
        }).toThrow("errorMessage é obrigatório quando status é failed");
    });

    it("deve comparar dois eventos como iguais", () => {
        const timestamp = new Date("2026-03-16T10:00:00.000Z");
        const first = TokenConsumptionEvent.create({
            requestId: validRequestId,
            modelUsed: "gpt-4o-mini",
            inputTokens: 50,
            outputTokens: 70,
            timestamp,
        });
        const second = TokenConsumptionEvent.create({
            requestId: validRequestId,
            modelUsed: "gpt-4o-mini",
            inputTokens: 50,
            outputTokens: 70,
            timestamp,
        });

        expect(first.equals(second)).toBe(true);
    });

    it("deve retornar representação textual", () => {
        const event = TokenConsumptionEvent.create({
            requestId: validRequestId,
            modelUsed: "gpt-4o-mini",
            inputTokens: 10,
            outputTokens: 20,
        });

        expect(event.toString()).toContain("TokenConsumptionEvent");
        expect(event.toString()).toContain("total=30");
    });
});
