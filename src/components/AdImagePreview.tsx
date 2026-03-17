"use client";

interface AdImagePreviewProps {
    imageUrl: string | null;
    loading?: boolean;
}

export function AdImagePreview({ imageUrl, loading }: AdImagePreviewProps) {
    if (!imageUrl && !loading) {
        return null;
    }

    if (loading) {
        return (
            <div className="w-full aspect-video bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                <svg
                    className="h-10 w-10 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                    />
                </svg>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imageUrl!}
                alt="Imagem publicitária gerada por IA"
                className="w-full h-auto rounded-xl object-cover"
            />
        </div>
    );
}
