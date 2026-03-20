import { authOptions } from "@/auth/infrastructure/auth/authOptions";
import { promptsContainer } from "@/prompts/promptsContainer";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updatePromptSchema = z.object({
    content: z
        .string()
        .trim()
        .min(10, { message: "O conteúdo deve ter ao menos 10 caracteres." })
        .max(10000, { message: "O conteúdo deve ter no máximo 10000 caracteres." }),
});

const togglePromptSchema = z.object({
    isActive: z.boolean(),
});

function unauthorizedResponse() {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
}

async function getOwnedPrompt(promptId: string, userId: string) {
    const prompt = await promptsContainer.userPromptRepository.findById(promptId);

    if (!prompt || prompt.userId !== userId) {
        return null;
    }

    return prompt;
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        return unauthorizedResponse();
    }

    const params = await context.params;
    const ownedPrompt = await getOwnedPrompt(params.id, userId);

    if (!ownedPrompt) {
        return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido." }, { status: 400 });
    }

    const parsed = updatePromptSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Dados inválidos.",
                details: parsed.error.flatten(),
            },
            { status: 400 }
        );
    }

    const updatedPrompt = await promptsContainer.userPromptRepository.update(
        ownedPrompt.id,
        parsed.data.content
    );

    return NextResponse.json(updatedPrompt, { status: 200 });
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        return unauthorizedResponse();
    }

    const params = await context.params;
    const ownedPrompt = await getOwnedPrompt(params.id, userId);

    if (!ownedPrompt) {
        return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido." }, { status: 400 });
    }

    const parsed = togglePromptSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Dados inválidos.",
                details: parsed.error.flatten(),
            },
            { status: 400 }
        );
    }

    if (!parsed.data.isActive) {
        const allPrompts = await promptsContainer.userPromptRepository.findAllByUserId(userId);
        const activeOfType = allPrompts.filter(
            (prompt) => prompt.type === ownedPrompt.type && prompt.isActive
        );

        if (ownedPrompt.isActive && activeOfType.length <= 1) {
            return NextResponse.json(
                {
                    error: "Não é possível desativar o único prompt ativo deste tipo.",
                },
                { status: 400 }
            );
        }

        const inactivatedPrompt = await promptsContainer.userPromptRepository.setInactive(ownedPrompt.id);
        return NextResponse.json(inactivatedPrompt, { status: 200 });
    }

    const activatedPrompt = await promptsContainer.userPromptRepository.setActive(ownedPrompt.id);
    return NextResponse.json(activatedPrompt, { status: 200 });
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        return unauthorizedResponse();
    }

    const params = await context.params;
    const ownedPrompt = await getOwnedPrompt(params.id, userId);

    if (!ownedPrompt) {
        return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
    }

    if (ownedPrompt.isActive) {
        const allPrompts = await promptsContainer.userPromptRepository.findAllByUserId(userId);
        const activeOfSameType = allPrompts.filter(
            (prompt) => prompt.type === ownedPrompt.type && prompt.isActive
        );

        if (activeOfSameType.length <= 1) {
            return NextResponse.json(
                {
                    error: "Não é possível deletar o único prompt ativo deste tipo.",
                },
                { status: 400 }
            );
        }
    }

    await promptsContainer.userPromptRepository.delete(ownedPrompt.id);
    return new NextResponse(null, { status: 204 });
}
