/** @jest-environment jsdom */

import { PromptEditor } from "@/app/prompts/PromptEditor";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@uiw/react-md-editor", () => {
    return function MockMDEditor({
        value,
        onChange,
    }: {
        value?: string;
        onChange?: (value?: string) => void;
    }) {
        return (
            <textarea
                data-testid="md-editor"
                value={value ?? ""}
                onChange={(event) => onChange?.(event.target.value)}
            />
        );
    };
});

describe("PromptEditor", () => {
    it("deve renderizar select com opções corretas", () => {
        render(
            <PromptEditor
                type={PromptType.TEXT_GENERATION}
                onSaveAction={async () => undefined}
            />
        );

        expect(screen.getByRole("option", { name: "TEXT_GENERATION" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "IMAGE_GENERATION" })).toBeInTheDocument();
    });

    it("deve chamar onSave com type, content e isActive", async () => {
        const onSave = jest.fn().mockResolvedValue(undefined);

        render(
            <PromptEditor
                type={PromptType.TEXT_GENERATION}
                onSaveAction={onSave}
            />
        );

        fireEvent.change(screen.getByTestId("md-editor"), {
            target: { value: "Prompt de teste válido" },
        });
        fireEvent.click(screen.getByLabelText("Marcar como ativo"));
        fireEvent.click(screen.getByRole("button", { name: "Salvar Prompt" }));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(
                PromptType.TEXT_GENERATION,
                "Prompt de teste válido",
                true
            );
        });
    });

    it("deve validar conteúdo obrigatório", async () => {
        const onSave = jest.fn().mockResolvedValue(undefined);

        render(
            <PromptEditor
                type={PromptType.TEXT_GENERATION}
                onSaveAction={onSave}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Salvar Prompt" }));

        expect(
            await screen.findByText("O conteúdo do prompt é obrigatório.")
        ).toBeInTheDocument();
        expect(onSave).not.toHaveBeenCalled();
    });
});
