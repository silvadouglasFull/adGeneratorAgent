import { registerWithCredentialsSchema } from "@/auth/application/validation/registerWithCredentialsSchema";
import { authContainer } from "@/auth/authContainer";
import { UserAlreadyExistsException } from "@/auth/domain/exception/UserAlreadyExistsException";
import { promptsContainer } from "@/prompts/promptsContainer";

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Body inválido." }, { status: 400 });
    }

    const parsed = registerWithCredentialsSchema.safeParse(body);

    if (!parsed.success) {
        return Response.json(
            {
                error: "Payload inválido para cadastro.",
                details: parsed.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
            { status: 400 }
        );
    }

    try {
        const user = await authContainer.registerUserWithCredentialsUseCase.execute(parsed.data);

        promptsContainer.defaultPromptSeeder
            .seedForUser(user.id)
            .catch((err) =>
                console.error("[DefaultPromptSeeder] Erro ao semear prompts para usuário", user.id, err)
            );

        return Response.json(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                registrationOrigin: user.registrationOrigin,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof UserAlreadyExistsException) {
            return Response.json({ error: error.message }, { status: 409 });
        }

        const message = error instanceof Error ? error.message : "Erro interno no cadastro.";
        return Response.json({ error: message }, { status: 500 });
    }
}
