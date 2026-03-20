import { authContainer } from "@/auth/authContainer";
import { InvalidCredentialsException } from "@/auth/domain/exception/InvalidCredentialsException";
import { getAuthEnv } from "@/auth/infrastructure/env/authEnv";
import { promptsContainer } from "@/prompts/promptsContainer";
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
        pages: {
            signIn: "/auth/login",
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

                const user = await authContainer.userRepository.upsertGoogleUser({
                    email,
                    name,
                });

                promptsContainer.defaultPromptSeeder
                    .seedForUser(user.id)
                    .catch((err) =>
                        console.error("[DefaultPromptSeeder] Erro ao semear prompts Google", user.id, err)
                    );

                return true;
            },
            async jwt({ token, user, account }) {
                // Google OAuth: user.id é o sub numérico do Google, não o UUID do banco
                if (user?.id && account?.provider === "google") {
                    const dbUser = await authContainer.userRepository.findByEmail(user.email!);
                    if (dbUser) {
                        token.userId = dbUser.id;
                    }
                    return token;
                }

                // Credenciais: user.id já é o UUID do banco
                if (user?.id) {
                    token.userId = user.id;
                    return token;
                }

                if (token.userId || !token.email) {
                    return token;
                }

                const existingUser = await authContainer.userRepository.findByEmail(token.email);
                if (existingUser) {
                    token.userId = existingUser.id;
                }

                return token;
            },
            async session({ session, token }) {
                if (session.user && typeof token.userId === "string") {
                    session.user.id = token.userId;
                }

                return session;
            },
        },
    };
}

export const authOptions = buildAuthOptions();
