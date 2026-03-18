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
    totalRealPerToken: number;
};

export function RealPerTokenTotalsBarChart({ totalRealPerToken }: Props) {
    const data = [{ name: "R$/Token (Geral)", value: totalRealPerToken }];

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
                Custo Total por Token (R$)
            </h3>
            <p className="text-xs text-gray-400 mb-4">
                Custo médio em reais por token considerando todos os anúncios
            </p>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        tickFormatter={(v: number) =>
                            v.toLocaleString("pt-BR", {
                                minimumFractionDigits: 6,
                                maximumFractionDigits: 6,
                            })
                        }
                    />
                    <Tooltip
                        formatter={(value) => [
                            typeof value === "number"
                                ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 8, maximumFractionDigits: 8 })}`
                                : String(value ?? 0),
                            "R$/Token",
                        ]}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
