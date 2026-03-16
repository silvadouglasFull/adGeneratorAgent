"use client";

import { ModelDropdown, type ModelOption } from "@/components/ModelDropdown";
import { useEffect, useState } from "react";

interface AdResponse {
  ad: string;
  metadata: {
    model?: string;
    generatedAt?: string;
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [result, setResult] = useState<AdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/agent/models");
        if (!res.ok) {
          setModelsError("Falha ao carregar modelos disponíveis.");
          return;
        }
        const data = await res.json() as { models: ModelOption[] };
        setModels(data.models);
        if (data.models.length > 0 && !data.models.some((m: ModelOption) => m.name === selectedModel)) {
          setSelectedModel(data.models[0].name);
        }
      } catch {
        setModelsError("Falha ao carregar modelos disponíveis.");
      } finally {
        setModelsLoading(false);
      }
    }
    fetchModels();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, model: selectedModel }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro desconhecido ao gerar o anúncio.");
      } else if (!res.body) {
        setError("A resposta do servidor não possui stream disponível.");
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let done = false;
        let buffer = "";
        let ad = "";

        setResult({ ad: "", metadata: {} });

        while (!done) {
          const readResult = await reader.read();
          done = readResult.done;

          if (readResult.value) {
            buffer += decoder.decode(readResult.value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const event of events) {
              const dataLine = event
                .split("\n")
                .find((line) => line.startsWith("data: "));

              if (!dataLine) {
                continue;
              }

              const payload = JSON.parse(dataLine.slice(6)) as {
                type: "token" | "done" | "error";
                content?: string;
                error?: string;
                metadata?: { model?: string; generatedAt?: string };
              };

              if (payload.type === "token" && payload.content) {
                ad += payload.content;
                setResult((previous) => ({
                  ad,
                  metadata: previous?.metadata ?? {},
                }));
              }

              if (payload.type === "done") {
                setResult((previous) => ({
                  ad: previous?.ad ?? ad,
                  metadata: payload.metadata ?? previous?.metadata ?? {},
                }));
              }

              if (payload.type === "error") {
                setError(payload.error ?? "Erro interno ao gerar o anúncio.");
              }
            }
          }
        }
      }
    } catch {
      setError("Falha ao se comunicar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Gerador de Anúncios IA
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Descreva seu produto ou serviço e receba um anúncio profissional gerado por IA.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Descrição do Produto ou Serviço
              </label>
              <textarea
                id="input"
                name="input"
                rows={5}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: Apartamento 2 quartos em Palmitos/SC, 78m², suíte, varanda com churrasqueira, 1 vaga, condomínio com elevador e salão de festas, R$ 420.000"
                className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm resize-none"
                required
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Inclua tipo de imóvel, localização, metragem, diferenciais e preço para gerar um anúncio imobiliário mais assertivo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo de IA
              </label>
              <ModelDropdown
                models={models}
                selected={selectedModel}
                onChange={setSelectedModel}
                disabled={loading}
                loading={modelsLoading}
                error={modelsError}
              />
            </div>

            <button
              type="submit"
              disabled={loading || input.trim() === ""}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Gerando anúncio...
                </>
              ) : (
                "Gerar Anúncio"
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-400 mt-0.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Anúncio Gerado</h2>
              {result.metadata.model && result.metadata.generatedAt && (
                <span className="text-xs text-gray-400">
                  {result.metadata.model} ·{" "}
                  {new Date(result.metadata.generatedAt).toLocaleString("pt-BR")}
                </span>
              )}
            </div>

            {/* Ad Preview */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-8">
              <AdPreview markdown={result.ad} />
            </div>

            {/* Raw Markdown */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 select-none">
                Ver Markdown bruto
              </summary>
              <pre className="mt-3 rounded-xl bg-gray-900 text-gray-100 p-5 text-xs overflow-x-auto whitespace-pre-wrap">
                {result.ad}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function AdPreview({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-2xl font-bold text-gray-900">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-semibold text-indigo-700 mt-4">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <p key={i} className="ml-4 text-gray-700">
              {renderInline(line.slice(2))}
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="text-gray-700 leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
