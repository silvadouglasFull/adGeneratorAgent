"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export function SignUpForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
            setLoading(false);
            setError(data.error ?? "Falha ao cadastrar usuário.");
            return;
        }

        const loginResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/",
        });

        setLoading(false);

        if (!loginResult || loginResult.error) {
            window.location.href = "/auth/login";
            return;
        }

        window.location.href = loginResult.url ?? "/";
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                required
            />
            <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                required
                minLength={8}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
                {loading ? "Cadastrando..." : "Criar conta"}
            </button>
            <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">ou</span>
                </div>
            </div>
            <GoogleAuthButton disabled={loading} label="Continuar com Google" />
        </form>
    );
}
