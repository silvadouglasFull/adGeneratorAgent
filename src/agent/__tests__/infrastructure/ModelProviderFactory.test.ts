jest.mock("@langchain/openai", () => ({
    ChatOpenAI: jest.fn().mockImplementation((config) => ({ ...config, _type: "ChatOpenAI" })),
}));

jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation((config) => ({ ...config, _type: "ChatGoogleGenerativeAI" })),
}));

import { ModelRegistry } from "@/agent/domain/model/ModelRegistry";
import { ModelProviderFactory } from "@/agent/infrastructure/providers/ModelProviderFactory";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

describe("ModelProviderFactory", () => {
    let registry: ModelRegistry;

    beforeEach(() => {
        jest.clearAllMocks();
        registry = ModelRegistry.default();
    });

    describe("create com gpt-4o-mini", () => {
        it("deve instanciar ChatOpenAI com baseURL Helicone quando apiKey presente", () => {
            const factory = new ModelProviderFactory(registry, "sk-helicone-test");
            factory.create("gpt-4o-mini", "user-123");

            expect(ChatOpenAI).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "gpt-4o-mini",
                    temperature: 0.7,
                    configuration: expect.objectContaining({
                        baseURL: "https://oai.helicone.ai/v1",
                        defaultHeaders: expect.objectContaining({
                            "Helicone-Auth": "Bearer sk-helicone-test",
                            "Helicone-User-Id": "user-123",
                        }),
                    }),
                })
            );
        });

        it("deve instanciar ChatOpenAI sem proxy quando apiKey ausente", () => {
            const factory = new ModelProviderFactory(registry, undefined);
            factory.create("gpt-4o-mini", "user-123");

            expect(ChatOpenAI).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "gpt-4o-mini",
                    temperature: 0.7,
                })
            );

            const args = (ChatOpenAI as unknown as jest.Mock).mock.calls[0][0];
            expect(args.configuration).toBeUndefined();
        });
    });

    describe("create com gemini-2.0-flash", () => {
        it("deve instanciar ChatGoogleGenerativeAI com baseUrl Helicone quando apiKey presente", () => {
            const factory = new ModelProviderFactory(registry, "sk-helicone-test");
            factory.create("gemini-2.0-flash", "user-456");

            expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "gemini-2.0-flash",
                    temperature: 0.7,
                    baseUrl: "https://gateway.helicone.ai",
                    customHeaders: expect.objectContaining({
                        "Helicone-Auth": "Bearer sk-helicone-test",
                        "Helicone-User-Id": "user-456",
                        "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
                    }),
                })
            );
        });

        it("deve instanciar ChatGoogleGenerativeAI sem proxy quando apiKey ausente", () => {
            const factory = new ModelProviderFactory(registry, undefined);
            factory.create("gemini-2.0-flash", "user-456");

            expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "gemini-2.0-flash",
                    temperature: 0.7,
                })
            );

            const args = (ChatGoogleGenerativeAI as unknown as jest.Mock).mock.calls[0][0];
            expect(args.baseUrl).toBeUndefined();
            expect(args.customHeaders).toBeUndefined();
        });
    });
});
