import { authOptions } from "@/auth/infrastructure/auth/authOptions";
import DashboardPageClient from "@/components/dashboard/DashboardPageClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth/login?callbackUrl=/dashboard");
    }

    return <DashboardPageClient />;
}
