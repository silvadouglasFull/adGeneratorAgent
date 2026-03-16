import { ChatPromptTemplate } from "@langchain/core/prompts";

export const adGeneratorPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `Você é um redator publicitário especialista. Siga RIGOROSAMENTE as instruções abaixo para gerar o anúncio.

{instructions}

REGRA CRÍTICA: Seu output deve começar EXATAMENTE com o caractere '#' e conter APENAS o Markdown do anúncio. Nenhum texto antes ou depois.`,
    ],
    [
        "human",
        "Gere um anúncio para o seguinte produto/serviço:\n\n{input}",
    ],
]);
