"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type AdTokenEntry = {
    requestId: string;
    tokens: number;
    generatedAt: string;
};

type Props = {
    data: AdTokenEntry[];
};

function shortId(requestId: string): string {
    return requestId.slice(0, 8);
}

export function TokensByAdBarChart({ data }: Props) {
    const chartData = data.map((entry) => ({
        name: shortId(entry.requestId),
        value: entry.tokens,
        fullId: entry.requestId,
        date: new Date(entry.generatedAt).toLocaleString("pt-BR"),
    }));

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
                Tokens por Anúncio
            </h3>
            <p className="text-xs text-gray-400 mb-4">
                Consumo de tokens de cada anúncio gerado individualmente
            </p>
            {chartData.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhum anúncio registrado.</p>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 4, right: 16, left: 0, bottom: 32 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip
                            formatter={(value) => [
                                typeof value === "number" ? value.toLocaleString("pt-BR") : String(value ?? 0),
                                "Tokens",
                            ]}
                            labelFormatter={(_label, payload) => {
                                const entry = payload?.[0]?.payload as { name?: string; date?: string } | undefined;
                                return `ID: ${entry?.name ?? ""} · ${entry?.date ?? ""}`;
                            }}
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        />
                        <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
