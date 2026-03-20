import { PromptType } from "@/prompts/domain/enum/PromptType";
import MDEditor from "@uiw/react-md-editor";
import { FormEvent, useEffect, useState } from "react";

type PromptEditorProps = {
    type: PromptType;
    initialContent?: string;
    isActive?: boolean;
    buttonLabel?: string;
    onSaveAction: (type: PromptType, content: string, isActive: boolean) => Promise<void>;
};

export function PromptEditor({
    type,
    initialContent,
    isActive,
    buttonLabel = "Salvar Prompt",
    onSaveAction,
}: PromptEditorProps) {
    const [selectedType, setSelectedType] = useState<PromptType>(type);
    const [content, setContent] = useState(initialContent ?? "");
    const [active, setActive] = useState(Boolean(isActive));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        setSelectedType(type);
    }, [type]);

    useEffect(() => {
        setContent(initialContent ?? "");
    }, [initialContent]);

    useEffect(() => {
        setActive(Boolean(isActive));
    }, [isActive]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!content.trim()) {
            setError("O conteúdo do prompt é obrigatório.");
            return;
        }

        setLoading(true);

        try {
            await onSaveAction(selectedType, content.trim(), active);
            setSuccess("Prompt salvo com sucesso.");
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Falha ao salvar prompt."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <p className="text-xs text-gray-500">Apenas 1 prompt ativo por tipo.</p>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="prompt-type">
                    Tipo do Prompt
                </label>
                <select
                    id="prompt-type"
                    value={selectedType}
                    onChange={(event) => setSelectedType(event.target.value as PromptType)}
                    disabled={loading}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                    <option value={PromptType.TEXT_GENERATION}>TEXT_GENERATION</option>
                    <option value={PromptType.IMAGE_GENERATION}>IMAGE_GENERATION</option>
                </select>
            </div>

            <div data-color-mode="light">
                <MDEditor
                    value={content}
                    onChange={(value) => setContent(value ?? "")}
                    height={260}
                    preview="edit"
                />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                    disabled={loading}
                />
                Marcar como ativo
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}

            <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? "Salvando..." : buttonLabel}
            </button>
        </form>
    );
}
