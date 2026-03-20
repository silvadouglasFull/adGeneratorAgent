"use client";

import { AdImagePreview } from "@/components/AdImagePreview";
import { ModelDropdown, type ModelOption } from "@/components/ModelDropdown";
import { Spinner } from "@/components/spinner";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AdResponse {
  ad: string;
  imageUrl?: string;
  metadata: {
    model?: string;
    generatedAt?: string;
    imageModel?: string;
    costBRL?: number | null;
  };
}

export default function HomePageClient() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [result, setResult] = useState<AdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
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
    setImageLoading(false);
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
                type: "token" | "done" | "error" | "image";
                content?: string;
                error?: string;
                imageUrl?: string;
                metadata?: {
                  model?: string;
                  generatedAt?: string;
                  imageModel?: string;
                  costBRL?: number | null;
                };
              };

              if (payload.type === "token" && payload.content) {
                ad += payload.content;
                setImageLoading(true);
                setResult((previous) => ({
                  ad,
                  imageUrl: previous?.imageUrl,
                  metadata: previous?.metadata ?? {},
                }));
              }

              if (payload.type === "image" && payload.imageUrl) {
                setImageLoading(false);
                setResult((previous) => ({
                  ad: previous?.ad ?? ad,
                  imageUrl: payload.imageUrl,
                  metadata: previous?.metadata ?? {},
                }));
              }

              if (payload.type === "done") {
                setImageLoading(false);
                setResult((previous) => ({
                  ad: previous?.ad ?? ad,
                  imageUrl: previous?.imageUrl,
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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Gerador de Anúncios IA
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Descreva seu produto ou serviço e receba um anúncio profissional gerado por IA.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 transition-colors"
            >
              Ver Dashboard de Consumo →
            </Link>
          </div>
        </div>

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
              className="
              btn w-full 
              flex items-center 
              justify-center 
              px-6 
              rounded-xl 
              text-sm
              focus-visible:outline 
              font-semibold
              focus-visible:outline-offset-2
              text-white shadow-sm
              disabled:opacity-50 
              disabled:cursor-not-allowed
              "
            >
              {loading ? (
                <>
                  <Spinner
                    color="text-white"
                    height={4}
                    width={4}
                    viewBox="0 0 24 24"
                  />
                  Gerando anúncio...
                </>
              ) : (
                "Gerar Anúncio"
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-500 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10A8 8 0 114 4.9V4a1 1 0 10-2 0v4a1 1 0 001 1h4a1 1 0 000-2H5.6A6 6 0 1016 10a1 1 0 112 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Anúncio Gerado
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {result.ad || (
                  <span className="text-gray-400">Aguardando geração...</span>
                )}
              </div>
            </div>

            {imageLoading && (
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-8 flex items-center justify-center">
                <Spinner color="text-indigo-600" height={8} width={8} viewBox="0 0 24 24" />
                <span className="ml-3 text-gray-500 text-sm">Gerando imagem...</span>
              </div>
            )}

            {result.imageUrl && (
              <AdImagePreview imageUrl={result.imageUrl} />
            )}

            {result.metadata && (result.metadata.model || result.metadata.generatedAt || result.metadata.costBRL !== undefined) && (
              <div className="bg-gray-50 ring-1 ring-gray-900/5 rounded-xl p-4 text-xs text-gray-500">
                {result.metadata.model && (
                  <p>Modelo: <span className="font-medium text-gray-700">{result.metadata.model}</span></p>
                )}
                {result.metadata.generatedAt && (
                  <p>Gerado em: <span className="font-medium text-gray-700">{new Date(result.metadata.generatedAt).toLocaleString("pt-BR")}</span></p>
                )}
                {result.metadata.costBRL !== undefined && result.metadata.costBRL !== null && (
                  <p>Custo estimado: <span className="font-medium text-gray-700">R$ {result.metadata.costBRL.toFixed(4)}</span></p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
