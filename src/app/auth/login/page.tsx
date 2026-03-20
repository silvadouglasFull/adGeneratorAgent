import { SignInForm } from "@/components/auth/SignInForm";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                <h1 className="text-xl font-semibold text-gray-900">Entrar</h1>
                <p className="mt-1 text-sm text-gray-500">Acesse sua conta com email e senha.</p>
                <div className="mt-5">
                    <SignInForm />
                </div>
                <p className="mt-4 text-sm text-gray-600">
                    Ainda não tem conta?{" "}
                    <Link href="/auth/signup" className="font-medium text-indigo-700 hover:text-indigo-500">
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    );
}
