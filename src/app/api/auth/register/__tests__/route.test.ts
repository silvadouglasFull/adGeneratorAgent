import { UserAlreadyExistsException } from "@/auth/domain/exception/UserAlreadyExistsException";

const mockRegisterUseCaseExecute = jest.fn();

jest.mock("@/auth/authContainer", () => ({
    authContainer: {
        registerUserWithCredentialsUseCase: {
            execute: (...args: unknown[]) => mockRegisterUseCaseExecute(...args),
        },
    },
}));

import { POST } from "../route";

describe("POST /api/auth/register", () => {
    beforeEach(() => {
        mockRegisterUseCaseExecute.mockReset();
    });

    it("retorna 400 quando body não é JSON válido", async () => {
        const request = new Request("http://localhost/api/auth/register", {
            method: "POST",
            body: "{",
            headers: { "content-type": "application/json" },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Body inválido.");
    });

    it("retorna 400 quando payload é inválido pelo Zod", async () => {
        const request = new Request("http://localhost/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ email: "invalido", password: "123", name: "a" }),
            headers: { "content-type": "application/json" },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Payload inválido para cadastro.");
        expect(Array.isArray(data.details)).toBe(true);
    });

    it("retorna 201 no cadastro com payload válido", async () => {
        mockRegisterUseCaseExecute.mockResolvedValue({
            id: "uuid-1",
            email: "user@example.com",
            name: "User",
            registrationOrigin: "default",
        });

        const request = new Request("http://localhost/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
                email: "user@example.com",
                password: "12345678",
                name: "User",
            }),
            headers: { "content-type": "application/json" },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toEqual({
            id: "uuid-1",
            email: "user@example.com",
            name: "User",
            registrationOrigin: "default",
        });
    });

    it("retorna 409 quando email já existe", async () => {
        mockRegisterUseCaseExecute.mockRejectedValue(new UserAlreadyExistsException("user@example.com"));

        const request = new Request("http://localhost/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
                email: "user@example.com",
                password: "12345678",
                name: "User",
            }),
            headers: { "content-type": "application/json" },
        });

        const response = await POST(request);

        expect(response.status).toBe(409);
    });
});
