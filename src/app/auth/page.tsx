import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function AuthPage() {
    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h1 className="text-xl font-semibold text-gray-900">Entrar</h1>
                    <p className="mt-1 text-sm text-gray-500">Use email e senha para acessar sua conta.</p>
                    <div className="mt-5 space-y-3">
                        <SignInForm />
                        <GoogleAuthButton label="Entrar com Google" />
                    </div>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h2 className="text-xl font-semibold text-gray-900">Criar conta</h2>
                    <p className="mt-1 text-sm text-gray-500">Cadastre-se com email/senha ou Google.</p>
                    <div className="mt-5 space-y-3">
                        <SignUpForm />
                        <GoogleAuthButton label="Criar conta com Google" />
                    </div>
                </section>
            </div>
        </div>
    );
}
