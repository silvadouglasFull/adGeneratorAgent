"use client";

import { PromptEditor } from "@/app/prompts/PromptEditor";
import { PromptsList } from "@/app/prompts/PromptsList";
import { UserPromptView } from "@/app/prompts/types";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import { useEffect, useMemo, useState } from "react";

type SavePayload = {
    mode: "create" | "edit";
    promptId?: string;
};

export default function PromptsPageClient() {
    const [prompts, setPrompts] = useState<UserPromptView[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

    const editingPrompt = useMemo(
        () => prompts.find((prompt) => prompt.id === editingPromptId) ?? null,
        [editingPromptId, prompts]
    );

    async function fetchPrompts() {
        const response = await fetch("/api/prompts");
        const data = (await response.json()) as UserPromptView[] | { error?: string };

        if (!response.ok) {
            throw new Error("error" in data && data.error ? data.error : "Falha ao carregar prompts.");
        }

        setPrompts(data as UserPromptView[]);
    }

    useEffect(() => {
        fetchPrompts()
            .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : "Falha ao carregar prompts.");
            })
            .finally(() => setLoadingInitial(false));
    }, []);

    async function savePrompt(
        type: PromptType,
        content: string,
        isActive: boolean,
        payload: SavePayload
    ) {
        if (payload.mode === "create") {
            const response = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, content, isActive }),
            });

            if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                throw new Error(data.error ?? "Falha ao criar prompt.");
            }

            await fetchPrompts();
            return;
        }

        if (!payload.promptId) {
            throw new Error("Prompt inválido para edição.");
        }

        const updateResponse = await fetch(`/api/prompts/${payload.promptId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });

        if (!updateResponse.ok) {
            const data = (await updateResponse.json()) as { error?: string };
            throw new Error(data.error ?? "Falha ao atualizar prompt.");
        }

        const currentPrompt = prompts.find((prompt) => prompt.id === payload.promptId);
        if (!currentPrompt) {
            await fetchPrompts();
            return;
        }

        if (currentPrompt.isActive !== isActive) {
            const toggleResponse = await fetch(`/api/prompts/${payload.promptId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });

            if (!toggleResponse.ok) {
                const data = (await toggleResponse.json()) as { error?: string };
                throw new Error(data.error ?? "Falha ao alterar status do prompt.");
            }
        }

        await fetchPrompts();
        setEditingPromptId(null);
    }

    async function handleDelete(id: string) {
        setError(null);
        setActionLoadingId(id);

        try {
            const response = await fetch(`/api/prompts/${id}`, {
                method: "DELETE",
            });

            if (!response.ok && response.status !== 204) {
                const data = (await response.json()) as { error?: string };
                throw new Error(data.error ?? "Falha ao deletar prompt.");
            }

            await fetchPrompts();

            if (editingPromptId === id) {
                setEditingPromptId(null);
            }
        } finally {
            setActionLoadingId(null);
        }
    }

    async function handleToggleActive(id: string, isActive: boolean) {
        setError(null);
        setActionLoadingId(id);

        try {
            const response = await fetch(`/api/prompts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });

            if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                throw new Error(data.error ?? "Falha ao atualizar status do prompt.");
            }

            await fetchPrompts();
        } finally {
            setActionLoadingId(null);
        }
    }

    if (loadingInitial) {
        return <p className="text-sm text-gray-500">Carregando prompts...</p>;
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                    {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
                </h2>
                <PromptEditor
                    type={editingPrompt?.type ?? PromptType.TEXT_GENERATION}
                    initialContent={editingPrompt?.content}
                    isActive={editingPrompt?.isActive ?? false}
                    buttonLabel={editingPrompt ? "Salvar Edição" : "Salvar Novo Prompt"}
                    onSaveAction={(type, content, isActive) =>
                        savePrompt(type, content, isActive, {
                            mode: editingPrompt ? "edit" : "create",
                            promptId: editingPrompt?.id,
                        })
                    }
                />
            </section>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <PromptsList
                prompts={prompts}
                deleteAction={handleDelete}
                editAction={(id) => {
                    setError(null);
                    setEditingPromptId(id);
                }}
                toggleActiveAction={handleToggleActive}
                loadingId={actionLoadingId}
            />
        </div>
    );
}
