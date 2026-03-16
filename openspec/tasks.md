# Tasks: Ad Generator Agent

Spec de referência: `openspec/specs/ad-generator-agent.md`

---

## Fase 1 — Setup e Infraestrutura

### T1 — Instalar dependências do agente

- [x] Instalar `@langchain/langgraph`, `@langchain/openai`, `@langchain/google-genai`, `@langchain/core`
- [x] Adicionar `OPENAI_API_KEY` e `GENAI_API` ao `.env.local`
- [x] Validar que o `.env.local` está no `.gitignore`
- **Critério**: `pnpm install` e `pnpm dev` rodam sem erros

### T2 — Criar o manual de instruções

- [x] Criar `/src/agent/instructions.md` com as regras de geração
- [x] Regras obrigatórias: estrutura Markdown, tom, tamanho, CTA
- **Critério**: arquivo existe e está legível pelo agente

---

## Fase 2 — Implementação do Agente

### T3 — Criar o AgentState e grafo LangGraph

- [x] Criar `/src/agent/adGeneratorAgent.ts`
- [x] Definir `AgentState` com campos: `input`, `instructions`, `ad`
- [x] Implementar nó `loadInstructions`: lê `/src/agent/instructions.md`
- [x] Implementar nó `generateAd`: chama o LLM com o input + manual e modelo selecionado (`gpt-4o-mini` ou `gemini-2.0-flash`)
- [x] Implementar nó `validateOutput`: verifica se output começa com `#` (Markdown)
- [x] Conectar os nós no grafo: `loadInstructions → generateAd → validateOutput`
- [x] Expor função de streaming token a token do output do nó `generateAd`
- **Critério**: `agent.invoke({ input: "Produto X" })` retorna `{ ad: "# ..." }`

### T4 — Prompt do agente

- [x] Criar `/src/agent/prompt.ts` com o system prompt
- [x] O prompt deve instruir o LLM a usar o manual e retornar apenas Markdown
- **Critério**: output nunca contém texto fora do bloco Markdown

---

## Fase 3 — API

### T5 — Criar o Route Handler

- [x] Criar `/src/app/api/agent/generate/route.ts`
- [x] Método: `POST`
- [x] Validar campo `input` (obrigatório, string não vazia)
- [x] Validar campo `model` (opcional: `gpt-4o-mini` | `gemini-2.0-flash`)
- [x] Chamar função de streaming do agente (`streamGeneratedAd`) com `input` e `model?`
- [x] Retornar `text/event-stream` no formato SSE com eventos `token`, `done` e `error`
- [x] Tratar erros com status HTTP adequado (400, 500)
- **Critério**: `POST /api/agent/generate` com body válido retorna 200 + stream SSE de Markdown

---

## Fase 4 — Testes

### T6 — Teste de integração do agente

- [x] Criar `/src/agent/__tests__/adGeneratorAgent.test.ts`
- [x] Mock do LLM (evitar custo em CI)
- [x] Testar: input válido → retorna Markdown com `#`
- [x] Testar: `loadInstructions` carrega o arquivo corretamente
- **Critério**: todos os testes passam com `pnpm test`

### T7 — Teste do endpoint

- [x] Criar `/src/app/api/agent/generate/__tests__/route.test.ts`
- [x] Testar: POST sem body → 400
- [x] Testar: POST com `input` vazio → 400
- [x] Testar: POST válido sem `model` → 200 com default `gpt-4o-mini`
- [x] Testar: POST válido com `model: gemini-2.0-flash` → 200 com metadata do modelo
- [x] Testar: POST válido → 200 com `text/event-stream` e eventos `token` + `done`
- [x] Testar: POST com `model` inválido → 400
- [x] Testar: erro do agente → evento `error` no stream
- **Critério**: todos os testes passam com `pnpm test`

---

## Fase 5 — Validação Final

### T8 — Teste manual end-to-end

- [x] Rodar `pnpm dev`
- [x] Fazer POST via curl ou Insomnia para `localhost:3000/api/agent/generate`
- [x] Verificar que o anúncio gerado segue as regras do manual
- **Critério**: anúncio gerado é válido e segue a estrutura esperada

---

## Ordem de execução sugerida

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

## Estimativa de complexidade

| Task | Complexidade |
| ---- | ------------ |
| T1   | Baixa        |
| T2   | Baixa        |
| T3   | Alta         |
| T4   | Média        |
| T5   | Média        |
| T6   | Média        |
| T7   | Baixa        |
| T8   | Baixa        |
