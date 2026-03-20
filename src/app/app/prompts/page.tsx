import PromptsPageClient from "@/app/prompts/PromptsPageClient";
import { authOptions } from "@/auth/infrastructure/auth/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function PromptsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/app/prompts");
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Meus Prompts</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Crie quantos prompts quiser, mas apenas 1 por tipo estará ativo.
                </p>

                <div className="mt-8">
                    <PromptsPageClient />
                </div>
            </div>
        </main>
    );
}