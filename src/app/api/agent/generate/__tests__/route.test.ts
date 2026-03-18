// Mock do agente para evitar chamadas reais à OpenAI
const mockStreamGeneratedAd = jest.fn();
const mockUseCaseExecute = jest.fn();
const mockEnsureConsumerStarted = jest.fn();

jest.mock("@/agent/adGeneratorAgent", () => ({
    TEXT_MODELS: ["gpt-4o-mini", "gemini-2.0-flash"],
    streamGeneratedAd: (...args: unknown[]) => mockStreamGeneratedAd(...args),
}));

jest.mock("@/tokenConsumption/tokenConsumption", () => ({
    ensureTokenConsumptionConsumerStarted: (...args: unknown[]) =>
        mockEnsureConsumerStarted(...args),
    tokenConsumptionContainer: {
        useCase: {
            execute: (...args: unknown[]) => mockUseCaseExecute(...args),
        },
        costCaptureService: {
            capture: jest.fn().mockResolvedValue({ costBRL: 0.4321 }),
        },
    },
}));

// Simula o ambiente Next.js para o handler
import { CostRecord } from "@/tokenConsumption/domain/model/CostRecord";
import { tokenConsumptionContainer } from "@/tokenConsumption/tokenConsumption";
import { POST } from "../route";

const mockCostCapture = tokenConsumptionContainer.costCaptureService
    .capture as unknown as jest.MockedFunction<typeof tokenConsumptionContainer.costCaptureService.capture>;

describe("POST /api/agent/generate", () => {
    beforeEach(() => {
        mockStreamGeneratedAd.mockReset();
        mockUseCaseExecute.mockReset();
        mockEnsureConsumerStarted.mockReset();
        mockEnsureConsumerStarted.mockResolvedValue(undefined);
        mockUseCaseExecute.mockResolvedValue(undefined);
        mockCostCapture.mockReset();
        mockCostCapture.mockResolvedValue(
            CostRecord.create({
                costUSD: 0.1,
                exchangeRateAtExecution: 4.321,
                heliconeRequestId: "helicone-request-123",
            })
        );
    });

    it("retorna 400 quando body está vazio", async () => {
        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("'input'");
    });

    it("retorna 400 quando input é uma string vazia", async () => {
        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "   " }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeTruthy();
    });

    it("retorna 400 com body inválido (não é JSON)", async () => {
        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "not-json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeTruthy();
    });

    it("retorna 200 com stream SSE para input válido", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Tênis Azul";
            yield "\n\n**Conforto e estilo**";
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Tênis casual masculino, cor azul, R$199" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("text/event-stream");
        expect(body).toContain('"type":"token"');
        expect(body).toContain("# Tênis Azul");
        expect(body).toContain('"type":"done"');
        expect(mockStreamGeneratedAd).toHaveBeenCalledWith({
            input: "Tênis casual masculino, cor azul, R$199",
            model: "gpt-4o-mini",
            heliconeRequestId: expect.any(String),
        });
        expect(mockEnsureConsumerStarted).toHaveBeenCalledTimes(1);
        expect(mockUseCaseExecute).toHaveBeenCalledTimes(1);
    });

    it("usa token usage real quando provider retorna usage no fim do stream", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Produto Real";
            return {
                ad: "# Produto Real",
                usage: {
                    inputTokens: 33,
                    outputTokens: 44,
                    totalTokens: 77,
                },
            };
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto X" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('"usage":{"inputTokens":33,"outputTokens":44,"totalTokens":77}');
        expect(mockUseCaseExecute).toHaveBeenCalledTimes(1);

        const savedEvent = mockUseCaseExecute.mock.calls[0][0] as {
            inputTokens: number;
            outputTokens: number;
        };

        expect(savedEvent.inputTokens).toBe(33);
        expect(savedEvent.outputTokens).toBe(44);
    });

    it("retorna 200 com modelo gemini-2.0-flash quando solicitado", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Produto Gemini";
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto X", model: "gemini-2.0-flash" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('"model":"gemini-2.0-flash"');
        expect(mockStreamGeneratedAd).toHaveBeenCalledWith({
            input: "Produto X",
            model: "gemini-2.0-flash",
            heliconeRequestId: expect.any(String),
        });
    });

    it("retorna 400 quando model é inválido", async () => {
        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto X", model: "modelo-invalido" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Modelo inválido");
    });

    it("retorna evento de erro no stream quando o agente falha", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            throw new Error("Falha no agente");
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto X" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('"type":"error"');
        expect(body).toContain("Falha no agente");
    });

    it("retorna evento image quando resultado inclui imageUrl", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Anúncio com Imagem";
            return {
                ad: "# Anúncio com Imagem",
                usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
                imageUrl: "data:image/png;base64,abc123",
                imageUsage: { inputTokens: 100, outputTokens: 200 },
            };
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto com imagem" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('"type":"image"');
        expect(body).toContain('"imageUrl":"data:image/png;base64,abc123"');
        expect(body).toContain('"imageModel":"gpt-image-1.5"');
        expect(body).toContain('"imageUsage"');
        expect(mockUseCaseExecute).toHaveBeenCalledTimes(2);

        const firstEvent = mockUseCaseExecute.mock.calls[0][0] as { modelUsed: string };
        const secondEvent = mockUseCaseExecute.mock.calls[1][0] as { modelUsed: string };
        expect(firstEvent.modelUsed).toBe("gpt-4o-mini");
        expect(secondEvent.modelUsed).toBe("gpt-image-1.5");
    });

    it("não emite evento image quando resultado não inclui imageUrl", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Anúncio Simples";
            return {
                ad: "# Anúncio Simples",
                usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
            };
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto sem imagem" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).not.toContain('"type":"image"');
        expect(body).not.toContain('"imageModel"');
        expect(mockUseCaseExecute).toHaveBeenCalledTimes(1);
    });

    it("inclui costBRL no evento done quando heliconeRequestId está presente", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Custo no Metadata";
            return {
                ad: "# Custo no Metadata",
                usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
                heliconeRequestId: "helicone-request-123",
            };
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto com custo" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(mockCostCapture).toHaveBeenCalledWith("helicone-request-123");
        expect(body).toContain('"costBRL":0.4321');
    });

    it("inclui costBRL no evento done usando heliconeRequestId de correlação da rota", async () => {
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Sem Helicone";
            return {
                ad: "# Sem Helicone",
                usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
            };
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto sem helicone id" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(mockCostCapture).toHaveBeenCalledWith(expect.any(String));
        expect(body).toContain('"costBRL":0.4321');
    });

    it("inclui costBRL null quando CostCaptureService falha", async () => {
        mockCostCapture.mockRejectedValueOnce(new Error("helicone indisponível"));
        mockStreamGeneratedAd.mockImplementation(async function* () {
            yield "# Falha Captura";
            return {
                ad: "# Falha Captura",
                usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
                heliconeRequestId: "helicone-request-erro",
            };
        });

        const request = new Request("http://localhost/api/agent/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: "Produto com falha de custo" }),
        });

        const response = await POST(request);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(mockCostCapture).toHaveBeenCalledWith("helicone-request-erro");
        expect(body).toContain('"costBRL":null');
    });
});
