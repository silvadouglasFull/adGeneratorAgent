import { authOptions } from "@/auth/infrastructure/auth/authOptions";
import HomePageClient from "@/components/home/HomePageClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth/login?callbackUrl=/");
    }

    return <HomePageClient />;
}
