import { readFileSync } from "fs";
import { join } from "path";

export class InstructionService {
    async load(): Promise<string> {
        const instructionsPath = join(process.cwd(), "src", "agent", "instructions.md");
        return readFileSync(instructionsPath, "utf-8");
    }
}
