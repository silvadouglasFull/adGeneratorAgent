/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { signOut } from "next-auth/react";
import { UserAvatarWithTooltip } from "../UserAvatarWithTooltip";

jest.mock("next-auth/react", () => ({
    signOut: jest.fn(),
}));

describe("UserAvatarWithTooltip", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renderiza o botão do avatar com aria-label correto", () => {
        render(<UserAvatarWithTooltip userName="Douglas" />);
        expect(screen.getByRole("button", { name: "Avatar de Douglas" })).toBeInTheDocument();
    });

    it("aplica fallback 'Usuário' quando nome está vazio", () => {
        render(<UserAvatarWithTooltip userName="   " />);
        expect(screen.getByRole("button", { name: "Avatar de Usuário" })).toBeInTheDocument();
    });

    it("não exibe dropdown inicialmente", () => {
        render(<UserAvatarWithTooltip userName="Douglas" />);
        expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
    });

    it("exibe dropdown com nome e botão 'Sair' ao clicar no avatar", () => {
        render(<UserAvatarWithTooltip userName="Douglas" />);
        fireEvent.click(screen.getByRole("button", { name: "Avatar de Douglas" }));
        expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
        expect(screen.getByText("Douglas")).toBeInTheDocument();
    });

    it("chama signOut com callbackUrl ao clicar em 'Sair'", () => {
        render(<UserAvatarWithTooltip userName="Douglas" />);
        fireEvent.click(screen.getByRole("button", { name: "Avatar de Douglas" }));
        fireEvent.click(screen.getByRole("button", { name: "Sair" }));
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/auth/login" });
    });

    it("fecha dropdown ao clicar fora do componente", async () => {
        render(
            <div>
                <UserAvatarWithTooltip userName="Douglas" />
                <div data-testid="outside">fora</div>
            </div>
        );
        fireEvent.click(screen.getByRole("button", { name: "Avatar de Douglas" }));
        expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByTestId("outside"));
        await waitFor(() => {
            expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
        });
    });

    it("fecha dropdown ao clicar novamente no avatar", () => {
        render(<UserAvatarWithTooltip userName="Douglas" />);
        const avatarBtn = screen.getByRole("button", { name: "Avatar de Douglas" });
        fireEvent.click(avatarBtn);
        expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
        fireEvent.click(avatarBtn);
        expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
    });
});
