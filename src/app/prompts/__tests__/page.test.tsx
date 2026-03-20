import PromptsPage from "@/app/app/prompts/page";

const mockGetServerSession = jest.fn();
const mockRedirect = jest.fn();

jest.mock("next-auth", () => ({
    getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

jest.mock("next/navigation", () => ({
    redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("@/auth/infrastructure/auth/authOptions", () => ({
    authOptions: {},
}));

jest.mock("@/app/prompts/PromptsPageClient", () => {
    return function MockPromptsPageClient() {
        return null;
    };
});

describe("PromptsPage", () => {
    beforeEach(() => {
        mockGetServerSession.mockReset();
        mockRedirect.mockReset();
    });

    it("deve redirecionar para /auth/login quando não autenticado", async () => {
        mockGetServerSession.mockResolvedValue(null);

        await PromptsPage();

        expect(mockRedirect).toHaveBeenCalledWith("/auth/login?callbackUrl=/app/prompts");
    });

    it("deve renderizar a página quando autenticado", async () => {
        mockGetServerSession.mockResolvedValue({
            user: {
                id: "user-id",
                email: "user@test.com",
            },
        });

        const element = await PromptsPage();

        expect(mockRedirect).not.toHaveBeenCalled();
        expect(element).toBeTruthy();
    });
});
