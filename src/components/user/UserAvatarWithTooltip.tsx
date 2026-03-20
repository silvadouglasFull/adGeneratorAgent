"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

interface UserAvatarWithTooltipProps {
    userName: string;
}

export function UserAvatarWithTooltip({ userName }: UserAvatarWithTooltipProps) {
    const safeUserName = userName.trim() || "Usuário";
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <div className="relative group">
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-label={`Avatar de ${safeUserName}`}
                    className="relative w-5 h-5 overflow-hidden bg-gray-100 rounded-full border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    <svg
                        className="absolute inset-0 m-auto w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                {!open && (
                    <div
                        role="tooltip"
                        className="pointer-events-none absolute right-0 top-7 z-10 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xs transition-opacity duration-300 group-hover:opacity-100"
                    >
                        {safeUserName}
                    </div>
                )}
            </div>
            {open && (
                <div className="absolute right-0 top-7 z-20 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500 truncate">
                        {safeUserName}
                    </div>
                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                    >
                        Sair
                    </button>
                </div>
            )}
        </div>
    );
}
