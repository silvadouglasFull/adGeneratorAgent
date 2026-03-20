"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export function SignInForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const response = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/",
        });

        setLoading(false);

        if (!response || response.error) {
            setError("Email ou senha inválidos.");
            return;
        }

        window.location.href = response.url ?? "/";
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
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
                placeholder="Sua senha"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
                {loading ? "Entrando..." : "Entrar"}
            </button>
        </form>
    );
}
