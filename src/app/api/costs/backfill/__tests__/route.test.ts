const mockExecute = jest.fn();

jest.mock("@/tokenConsumption/application/service/TokenCostBackfillService", () => ({
    TokenCostBackfillService: jest.fn().mockImplementation(() => ({
        execute: (...args: unknown[]) => mockExecute(...args),
    })),
}));

jest.mock("@/tokenConsumption/infrastructure/persistence/TokenCostBackfillRepository", () => ({
    TokenCostBackfillRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@/tokenConsumption/tokenConsumption", () => ({
    tokenConsumptionContainer: {
        costCaptureService: {
            capture: jest.fn(),
        },
    },
}));

import { POST } from "@/app/api/costs/backfill/route";

describe("POST /api/costs/backfill", () => {
    beforeEach(() => {
        mockExecute.mockReset();
        mockExecute.mockResolvedValue({
            scanned: 10,
            updated: 7,
            skipped: 2,
            failed: 1,
        });
    });

    it("deve retornar 200 com sumário quando body está ausente", async () => {
        const request = new Request("http://localhost/api/costs/backfill", {
            method: "POST",
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mockExecute).toHaveBeenCalledWith(50);
        expect(body.updated).toBe(7);
    });

    it("deve retornar 200 com limit informado", async () => {
        const request = new Request("http://localhost/api/costs/backfill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: 25 }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockExecute).toHaveBeenCalledWith(25);
    });

    it("deve retornar 400 para body inválido", async () => {
        const request = new Request("http://localhost/api/costs/backfill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "not-json",
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("Body inválido");
    });

    it("deve retornar 400 para limit fora do intervalo", async () => {
        const request = new Request("http://localhost/api/costs/backfill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: 0 }),
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("limit");
    });
});
