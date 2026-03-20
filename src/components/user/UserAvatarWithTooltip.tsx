interface UserAvatarWithTooltipProps {
    userName: string;
}

export function UserAvatarWithTooltip({ userName }: UserAvatarWithTooltipProps) {
    const safeUserName = userName.trim() || "Usuário";

    return (
        <div className="relative group" aria-label={`Avatar de ${safeUserName}`}>
            <div className="relative w-5 h-5 overflow-hidden bg-gray-100 rounded-full border border-gray-200">
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
            </div>

            <div
                role="tooltip"
                className="pointer-events-none absolute right-0 top-12 z-10 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xs transition-opacity duration-300 group-hover:opacity-100"
            >
                {safeUserName}
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
    );
}
