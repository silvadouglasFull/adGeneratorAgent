import { authOptions } from "@/auth/infrastructure/auth/authOptions";
import { getServerSession, Session } from "next-auth";

const session = await getServerSession(authOptions);
const userName = session?.user?.name ?? "Usuário";

export const sessionInformation: Session & { userName: string } = {
  user: session?.user,
  expires: session?.expires ?? "",
  userName,
};