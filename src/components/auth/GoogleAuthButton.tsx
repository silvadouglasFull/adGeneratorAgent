"use client";

import { signIn } from "next-auth/react";

interface GoogleAuthButtonProps {
    disabled?: boolean;
    label: string;
}

export function GoogleAuthButton({ disabled = false, label }: GoogleAuthButtonProps) {
    return (
        <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            disabled={disabled}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {label}
        </button>
    );
}
