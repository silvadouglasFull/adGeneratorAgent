/* eslint-disable @typescript-eslint/no-explicit-any */

import { ImagePromptService } from "../../domain/service/ImagePromptService";

describe("ImagePromptService", () => {
    const mockModelInitializer = {
        initialize: jest.fn(),
    };

    const mockPrompt = {
        pipe: jest.fn(),
    };

    let service: ImagePromptService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ImagePromptService(mockModelInitializer, mockPrompt);
    });

    it("deve gerar prompt técnico de imagem a partir do input", async () => {
        const mockChain = {
            invoke: jest.fn().mockResolvedValue({
                content: "A photorealistic HDR drone shot of a modern apartment building",
            }),
        };
        mockModelInitializer.initialize.mockResolvedValue({} as any);
        mockPrompt.pipe.mockReturnValue(mockChain);

        const result = await service.generate("Apartamento 2 quartos em Palmitos/SC");

        expect(result).toBe("A photorealistic HDR drone shot of a modern apartment building");
        expect(mockModelInitializer.initialize).toHaveBeenCalledWith("gpt-4o-mini", 0.7, 0);
        expect(mockChain.invoke).toHaveBeenCalledWith({ input: "Apartamento 2 quartos em Palmitos/SC" });
    });

    it("deve usar modelo especificado quando fornecido", async () => {
        const mockChain = {
            invoke: jest.fn().mockResolvedValue({ content: "prompt result" }),
        };
        mockModelInitializer.initialize.mockResolvedValue({} as any);
        mockPrompt.pipe.mockReturnValue(mockChain);

        await service.generate("Produto X", "gemini-2.0-flash");

        expect(mockModelInitializer.initialize).toHaveBeenCalledWith("gemini-2.0-flash", 0.7, 0);
    });

    it("deve fazer trim do resultado", async () => {
        const mockChain = {
            invoke: jest.fn().mockResolvedValue({ content: "  prompt with spaces  \n" }),
        };
        mockModelInitializer.initialize.mockResolvedValue({} as any);
        mockPrompt.pipe.mockReturnValue(mockChain);

        const result = await service.generate("input");

        expect(result).toBe("prompt with spaces");
    });
});
