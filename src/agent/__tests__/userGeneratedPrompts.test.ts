import { PromptType } from "@/prompts/domain/enum/PromptType";
import { ActivePromptNotFoundError } from "@/prompts/domain/exception/ActivePromptNotFoundError";

const fetchActivePromptMock = jest.fn();
const streamMock = jest.fn();

jest.mock("@/prompts/promptsContainer", () => ({
    promptsContainer: {
        promptFetchService: {
            fetchActivePrompt: (...args: unknown[]) => fetchActivePromptMock(...args),
        },
    },
}));

jest.mock("../application/graph/AdGeneratorGraphBuilder", () => ({
    AdGeneratorGraphBuilder: {
        build: jest.fn(() => ({
            compile: jest.fn(() => ({ graph: "mock" })),
        })),
    },
}));

jest.mock("../application/stream/AdStreamGenerator", () => ({
    AdStreamGenerator: jest.fn().mockImplementation(() => ({
        stream: (...args: unknown[]) => streamMock(...args),
    })),
    MessageParser: {},
}));

jest.mock("../domain/service/ImageGenerationService", () => ({
    ImageGenerationService: jest.fn().mockImplementation(() => ({
        generate: jest.fn(),
    })),
}));

import { streamGeneratedAd } from "../adGeneratorAgent";

function generatorFromArray(tokens: string[]) {
    return (async function* () {
        for (const token of tokens) {
            yield token;
        }
        return {
            ad: "# ad",
            usage: undefined,
            imageUrl: undefined,
            imageUsage: undefined,
            heliconeRequestId: undefined,
        };
    })();
}

describe("streamGeneratedAd com prompts dinâmicos", () => {
    beforeEach(() => {
        fetchActivePromptMock.mockReset();
        streamMock.mockReset();
        streamMock.mockReturnValue(generatorFromArray(["# ad"]));
    });

    it("deve buscar prompt ativo de texto quando intenção for textual", async () => {
        fetchActivePromptMock.mockResolvedValue("prompt de texto");

        const stream = streamGeneratedAd({
            input: "crie um texto de anúncio",
            model: "gpt-4o-mini",
            sessionUserId: "user-1",
        });

        await stream.next();
        await stream.next();

        expect(fetchActivePromptMock).toHaveBeenCalledWith(
            "user-1",
            PromptType.TEXT_GENERATION
        );
    });

    it("deve buscar prompt ativo de imagem quando intenção for de imagem", async () => {
        fetchActivePromptMock.mockResolvedValue("prompt de imagem");

        const stream = streamGeneratedAd({
            input: "gere uma imagem para o anúncio",
            model: "gpt-4o-mini",
            sessionUserId: "user-1",
        });

        await stream.next();
        await stream.next();

        expect(fetchActivePromptMock).toHaveBeenCalledWith(
            "user-1",
            PromptType.IMAGE_GENERATION
        );
    });

    it("deve lançar erro quando prompt ativo não existir", async () => {
        fetchActivePromptMock.mockRejectedValue(
            new ActivePromptNotFoundError(PromptType.TEXT_GENERATION)
        );

        await expect(async () => {
            const stream = streamGeneratedAd({
                input: "crie um texto de anúncio",
                model: "gpt-4o-mini",
                sessionUserId: "user-1",
            });
            await stream.next();
        }).rejects.toBeInstanceOf(ActivePromptNotFoundError);
    });

    it("deve buscar prompts de texto e imagem quando intenção for BOTH", async () => {
        fetchActivePromptMock
            .mockResolvedValueOnce("prompt texto")
            .mockResolvedValueOnce("prompt imagem");

        const stream = streamGeneratedAd({
            input: "crie um texto de campanha e gere uma imagem",
            model: "gpt-4o-mini",
            sessionUserId: "user-1",
        });

        await stream.next();
        await stream.next();

        expect(fetchActivePromptMock).toHaveBeenCalledWith(
            "user-1",
            PromptType.TEXT_GENERATION
        );
        expect(fetchActivePromptMock).toHaveBeenCalledWith(
            "user-1",
            PromptType.IMAGE_GENERATION
        );
    });
});
