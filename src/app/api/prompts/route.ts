import { authOptions } from "@/auth/infrastructure/auth/authOptions";
import { createUserPromptSchema } from "@/prompts/application/dto/CreateUserPromptDTO";
import { PromptType } from "@/prompts/domain/enum/PromptType";
import { promptsContainer } from "@/prompts/promptsContainer";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

function unauthorizedResponse() {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const typeFilter = url.searchParams.get("type");

    const prompts = await promptsContainer.userPromptRepository.findAllByUserId(userId);

    if (!typeFilter) {
        return NextResponse.json(prompts, { status: 200 });
    }

    const parsedType = z.nativeEnum(PromptType).safeParse(typeFilter);
    if (!parsedType.success) {
        return NextResponse.json({ error: "Tipo de prompt inválido." }, { status: 400 });
    }

    const filteredPrompts = prompts.filter((prompt) => prompt.type === parsedType.data);
    return NextResponse.json(filteredPrompts, { status: 200 });
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        return unauthorizedResponse();
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido." }, { status: 400 });
    }

    const parsed = createUserPromptSchema.safeParse({
        ...(typeof body === "object" && body ? body : {}),
        userId,
    });

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Dados inválidos.",
                details: parsed.error.flatten(),
            },
            { status: 400 }
        );
    }

    try {
        const createdPrompt = await promptsContainer.userPromptRepository.create(parsed.data);

        if (parsed.data.isActive) {
            const activatedPrompt = await promptsContainer.userPromptRepository.setActive(createdPrompt.id);
            return NextResponse.json(activatedPrompt, { status: 201 });
        }

        return NextResponse.json(createdPrompt, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao criar prompt.",
            },
            { status: 500 }
        );
    }
}
