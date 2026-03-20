"use client";

import { RealPerTokenByAdBarChart } from "@/components/dashboard/RealPerTokenByAdBarChart";
import { RealPerTokenTotalsBarChart } from "@/components/dashboard/RealPerTokenTotalsBarChart";
import { TokensByAdBarChart } from "@/components/dashboard/TokensByAdBarChart";
import { TokenTotalsBarChart } from "@/components/dashboard/TokenTotalsBarChart";
import { Spinner } from "@/components/spinner";
import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardData = {
    totals: {
        totalTokens: number;
        totalCostBRL: number;
        totalRealPerToken: number;
    };
    tokensByAd: { requestId: string; tokens: number; generatedAt: string }[];
    realPerTokenByAd: {
        requestId: string;
        realPerToken: number;
        generatedAt: string;
    }[];
};

export default function DashboardPageClient() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/costs/dashboard");
                if (!res.ok) {
                    setError("Não foi possível carregar os dados do dashboard.");
                    return;
                }
                const json = (await res.json()) as DashboardData;
                setData(json);
            } catch {
                setError("Falha ao se comunicar com o servidor.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                            Dashboard
                        </h1>
                        <p className="mt-2 text-lg text-gray-500">
                            Consumo de tokens e custo por token dos anúncios gerados.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="text-sm font-medium text-indigo-700 hover:text-indigo-500 transition-colors"
                    >
                        ← Voltar ao Gerador
                    </Link>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <Spinner
                            color="text-indigo-600"
                            height={8}
                            width={8}
                            viewBox="0 0 24 24"
                        />
                        <span className="ml-3 text-gray-500 text-sm">Carregando dados...</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {!loading && !error && data && data.tokensByAd.length === 0 && (
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 p-12 text-center">
                        <p className="text-gray-500 text-sm">
                            Nenhum anúncio registrado ainda. Gere seu primeiro anúncio para
                            visualizar os dados aqui.
                        </p>
                        <Link
                            href="/"
                            className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:text-indigo-500"
                        >
                            Gerar anúncio →
                        </Link>
                    </div>
                )}

                {!loading && !error && data && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-5">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Total de Tokens</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {data.totals.totalTokens.toLocaleString("pt-BR")}
                                </p>
                            </div>
                            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-5">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Custo Total (R$)</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {data.totals.totalCostBRL.toLocaleString("pt-BR", {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 4,
                                    })}
                                </p>
                            </div>
                            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-5">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Anúncios Gerados</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {data.tokensByAd.length.toLocaleString("pt-BR")}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TokenTotalsBarChart totalTokens={data.totals.totalTokens} />
                            <RealPerTokenTotalsBarChart
                                totalRealPerToken={data.totals.totalRealPerToken}
                            />
                            <TokensByAdBarChart data={data.tokensByAd} />
                            <RealPerTokenByAdBarChart data={data.realPerTokenByAd} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
