import { readFileSync } from "fs";
import { join } from "path";
import { InstructionService } from "../../domain/service/InstructionService";

describe("InstructionService", () => {
    let service: InstructionService;

    beforeEach(() => {
        service = new InstructionService();
    });

    it("deve carregar instruções do arquivo", async () => {
        const instructions = await service.load();
        expect(instructions).toBeTruthy();
        expect(typeof instructions).toBe("string");
        expect(instructions.length).toBeGreaterThan(0);
    });

    it("deve carregar o mesmo conteúdo que readFileSync", async () => {
        const instructions = await service.load();
        const instructionsPath = join(process.cwd(), "src", "agent", "instructions.md");
        const expectedContent = readFileSync(instructionsPath, "utf-8");
        expect(instructions).toBe(expectedContent);
    });

    it("deve conter markdown headers", async () => {
        const instructions = await service.load();
        expect(instructions).toContain("#");
    });
});
