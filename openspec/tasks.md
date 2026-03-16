# Tasks: Ad Generator Agent

Spec de referência: `openspec/specs/ad-generator-agent.md`

---

## Fase 1 — Setup e Infraestrutura

### T1 — Instalar dependências do agente

- [ ] Instalar `@langchain/langgraph`, `@langchain/openai`, `@langchain/core`
- [ ] Adicionar `OPENAI_API_KEY` ao `.env.local`
- [ ] Validar que o `.env.local` está no `.gitignore`
- **Critério**: `pnpm install` e `pnpm dev` rodam sem erros

### T2 — Criar o manual de instruções

- [ ] Criar `/src/agent/instructions.md` com as regras de geração
- [ ] Regras obrigatórias: estrutura Markdown, tom, tamanho, CTA
- **Critério**: arquivo existe e está legível pelo agente

---

## Fase 2 — Implementação do Agente

### T3 — Criar o AgentState e grafo LangGraph

- [ ] Criar `/src/agent/adGeneratorAgent.ts`
- [ ] Definir `AgentState` com campos: `input`, `instructions`, `ad`
- [ ] Implementar nó `loadInstructions`: lê `/src/agent/instructions.md`
- [ ] Implementar nó `generateAd`: chama o LLM com o input + manual
- [ ] Implementar nó `validateOutput`: verifica se output começa com `#` (Markdown)
- [ ] Conectar os nós no grafo: `loadInstructions → generateAd → validateOutput`
- [ ] Expor função de streaming token a token do output do nó `generateAd`
- **Critério**: `agent.invoke({ input: "Produto X" })` retorna `{ ad: "# ..." }`

### T4 — Prompt do agente

- [ ] Criar `/src/agent/prompt.ts` com o system prompt
- [ ] O prompt deve instruir o LLM a usar o manual e retornar apenas Markdown
- **Critério**: output nunca contém texto fora do bloco Markdown

---

## Fase 3 — API

### T5 — Criar o Route Handler

- [ ] Criar `/src/app/api/agent/generate/route.ts`
- [ ] Método: `POST`
- [ ] Validar campo `input` (obrigatório, string não vazia)
- [ ] Chamar função de streaming do agente (`streamGeneratedAd`)
- [ ] Retornar `text/event-stream` no formato SSE com eventos `token`, `done` e `error`
- [ ] Tratar erros com status HTTP adequado (400, 500)
- **Critério**: `POST /api/agent/generate` com body válido retorna 200 + stream SSE de Markdown

---

## Fase 4 — Testes

### T6 — Teste de integração do agente

- [ ] Criar `/src/agent/__tests__/adGeneratorAgent.test.ts`
- [ ] Mock do LLM (evitar custo em CI)
- [ ] Testar: input válido → retorna Markdown com `#`
- [ ] Testar: `loadInstructions` carrega o arquivo corretamente
- **Critério**: todos os testes passam com `pnpm test`

### T7 — Teste do endpoint

- [ ] Criar `/src/app/api/agent/generate/__tests__/route.test.ts`
- [ ] Testar: POST sem body → 400
- [ ] Testar: POST com `input` vazio → 400
- [ ] Testar: POST válido → 200 com `text/event-stream` e eventos `token` + `done`
- [ ] Testar: erro do agente → evento `error` no stream
- **Critério**: todos os testes passam com `pnpm test`

---

## Fase 5 — Validação Final

### T8 — Teste manual end-to-end

- [ ] Rodar `pnpm dev`
- [ ] Fazer POST via curl ou Insomnia para `localhost:3000/api/agent/generate`
- [ ] Verificar que o anúncio gerado segue as regras do manual
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
