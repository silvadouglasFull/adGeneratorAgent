"use client";

export type ModelOption = {
    name: string;
    displayName: string;
    provider: string;
    isFree: boolean;
};

type ModelDropdownProps = {
    models: ModelOption[];
    selected: string;
    onChange: (modelName: string) => void;
    disabled?: boolean;
    loading?: boolean;
    error?: string | null;
};

export function ModelDropdown({
    models,
    selected,
    onChange,
    disabled = false,
    loading = false,
    error = null,
}: ModelDropdownProps) {
    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <select
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || loading || models.length === 0}
            className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Modelo de IA"
        >
            {loading && <option value="">Carregando modelos...</option>}
            {!loading && models.length === 0 && <option value="">Nenhum modelo disponível</option>}
            {models.map((m) => (
                <option key={m.name} value={m.name}>
                    {m.displayName} — {m.provider}{m.isFree ? " (grátis)" : ""}
                </option>
            ))}
        </select>
    );
}
