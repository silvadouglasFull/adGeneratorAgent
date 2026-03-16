import { InvalidAdFormatException } from "../exception/InvalidAdFormatException";

export class OutputValidationService {
    validate(output: string): string {
        if (!output || !output.trimStart().startsWith("#")) {
            throw new InvalidAdFormatException();
        }
        return output.trim();
    }
}
