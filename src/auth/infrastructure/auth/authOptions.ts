import { authContainer } from "@/auth/authContainer";
import { InvalidCredentialsException } from "@/auth/domain/exception/InvalidCredentialsException";
import { getAuthEnv } from "@/auth/infrastructure/env/authEnv";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export function buildAuthOptions(): NextAuthOptions {
    const authEnv = getAuthEnv();

    return {
        secret: authEnv.NEXT_AUTH_SECRETE,
        session: {
            strategy: "jwt",
        },
        providers: [
            CredentialsProvider({
                name: "Credentials",
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" },
                },
                async authorize(credentials) {
                    const email = credentials?.email?.trim();
                    const password = credentials?.password;

                    if (!email || !password) {
                        return null;
                    }

                    try {
                        const user = await authContainer.authenticateUserWithCredentialsUseCase.execute(
                            email,
                            password
                        );

                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                        };
                    } catch (error) {
                        if (error instanceof InvalidCredentialsException) {
                            return null;
                        }

                        throw error;
                    }
                },
            }),
            GoogleProvider({
                clientId: authEnv.GOOGLE_CLIENT_ID,
                clientSecret: authEnv.GOOGLE_CLIENT_SECRETE,
            }),
        ],
        callbacks: {
            async signIn({ account, profile }) {
                if (account?.provider !== "google") {
                    return true;
                }

                const email = profile?.email?.trim();
                const name = profile?.name?.trim() || "Usuário Google";

                if (!email) {
                    return false;
                }

                await authContainer.userRepository.upsertGoogleUser({
                    email,
                    name,
                });

                return true;
            },
        },
    };
}

export const authOptions = buildAuthOptions();
