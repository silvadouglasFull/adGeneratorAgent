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

type Props = {
    totalTokens: number;
};

export function TokenTotalsBarChart({ totalTokens }: Props) {
    const data = [{ name: "Total de Tokens", value: totalTokens }];

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
                Consumo Total de Tokens
            </h3>
            <p className="text-xs text-gray-400 mb-4">
                Soma de todos os tokens gerados em todos os anúncios
            </p>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip
                        formatter={(value) => [
                            typeof value === "number" ? value.toLocaleString("pt-BR") : String(value ?? 0),
                            "Tokens",
                        ]}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
