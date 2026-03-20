import { UserPromptView } from "@/app/prompts/types";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import { useMemo } from "react";

type PromptsListProps = {
    prompts: UserPromptView[];
    deleteAction: (id: string) => Promise<void>;
    editAction: (id: string) => void;
    toggleActiveAction: (id: string, isActive: boolean) => Promise<void>;
    loadingId?: string | null;
};

export function PromptsList({
    prompts,
    deleteAction,
    editAction,
    toggleActiveAction,
    loadingId,
}: PromptsListProps) {
    const grouped = useMemo(() => {
        return {
            [PromptType.TEXT_GENERATION]: prompts.filter(
                (prompt) => prompt.type === PromptType.TEXT_GENERATION
            ),
            [PromptType.IMAGE_GENERATION]: prompts.filter(
                (prompt) => prompt.type === PromptType.IMAGE_GENERATION
            ),
        };
    }, [prompts]);

    async function handleDelete(promptId: string) {
        const confirmed = window.confirm("Deseja realmente deletar este prompt?");

        if (!confirmed) {
            return;
        }

        await deleteAction(promptId);
    }

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([type, typePrompts]) => (
                <section key={type} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        {type === PromptType.TEXT_GENERATION
                            ? "TEXT_GENERATION"
                            : "IMAGE_GENERATION"}
                    </h3>

                    {typePrompts.length === 0 && (
                        <p className="text-sm text-gray-500">Nenhum prompt deste tipo cadastrado.</p>
                    )}

                    <ul className="space-y-3">
                        {typePrompts.map((prompt) => (
                            <li key={prompt.id} className="rounded-xl border border-gray-200 p-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {new Date(prompt.updatedAt).toLocaleString("pt-BR")}
                                        </span>
                                        {prompt.isActive && (
                                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                                ★ Ativo
                                            </span>
                                        )}
                                    </div>

                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={prompt.isActive}
                                            disabled={loadingId === prompt.id}
                                            onChange={(event) =>
                                                toggleActiveAction(prompt.id, event.target.checked)
                                            }
                                        />
                                        Ativo
                                    </label>
                                </div>

                                <p className="mb-3 line-clamp-3 whitespace-pre-wrap text-sm text-gray-700">
                                    {prompt.content}
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700"
                                        onClick={() => editAction(prompt.id)}
                                        disabled={loadingId === prompt.id}
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700"
                                        onClick={() => handleDelete(prompt.id)}
                                        disabled={loadingId === prompt.id}
                                    >
                                        Deletar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
