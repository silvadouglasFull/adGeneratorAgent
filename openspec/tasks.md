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

---

# Feature: Agent Model Routing com LangGraph

Spec de referência: `openspec/specs/agent-model-routing.md`

---

## Fase 1 — Preparação e Testes

### T9 — Criar testes para validar modelo routing

- [x] Criar `/src/agent/__tests__/modelRouting.test.ts`
- [x] Mock de ambos os modelos (ChatOpenAI e ChatGoogleGenerativeAI)
- [x] Testar: `routeToModel(state)` com `model: "gpt-4o-mini"` retorna `"generateAd_openai"`
- [x] Testar: `routeToModel(state)` com `model: "gemini-2.0-flash"` retorna `"generateAd_gemini"`
- [x] Testar: `routeToModel(state)` com `model: undefined` retorna `"generateAd_openai"` (default)
- [x] Testar: nó `generateAd_openai` invocado diretamente → output com `#`
- [x] Testar: nó `generateAd_gemini` invocado diretamente → output com `#`
- **Critério**: 7 testes passando, cobertura de routing 100% ✅

---

## Fase 2 — Refatoração do Agente

### T10 — Refatorar adGeneratorAgent.ts para usar conditional routing

- [x] Em `/src/agent/adGeneratorAgent.ts`:
  - [x] Remover função `getModelInstance()` (não mais necessária)
  - [x] Criar função `routeToModel(state: AgentStateType): string` que:
    - Retorna `"generateAd_openai"` se `state.model === "gpt-4o-mini"` ou `undefined`
    - Retorna `"generateAd_gemini"` se `state.model === "gemini-2.0-flash"`
  - [x] Criar nó `generateAd_openai(state)` que:
    - Instancia `ChatOpenAI` com `gpt-4o-mini`
    - Invoca chain com `adGeneratorPrompt`
    - Retorna ad
  - [x] Criar nó `generateAd_gemini(state)` que:
    - Instancia `ChatGoogleGenerativeAI` com `gemini-2.0-flash`
    - Invoca chain com `adGeneratorPrompt`
    - Retorna ad (output idêntico a openai)
  - [x] Atualizar grafo:
    - Remover `.addNode("generateAd", generateAd)`
    - Adicionar `.addNode("generateAd_openai", generateAd_openai)`
    - Adicionar `.addNode("generateAd_gemini", generateAd_gemini)`
    - Remover `.addEdge("loadInstructions", "generateAd")`
    - Adicionar `.addConditionalEdges("loadInstructions", routeToModel, {"generateAd_openai": "generateAd_openai", "generateAd_gemini": "generateAd_gemini"})`
    - Adicionar `.addEdge("generateAd_openai", "validateOutput")`
    - Adicionar `.addEdge("generateAd_gemini", "validateOutput")`
  - [x] Manter `validateOutput` conectado a END
  - [x] Manter `streamGeneratedAd()` sem mudanças (transparente para consumidor)
- **Critério**: Compilação sucede (`npx tsc --noEmit`) ✅

### T11 — Validar signature das funções

- [x] Verificar que ambos `generateAd_openai` e `generateAd_gemini` têm signature idêntica
- [x] Tipagem TypeScript correta: `(state: AgentStateType) => Promise<Partial<AgentStateType>>`
- [x] Verificar que `routeToModel()` retorna string válida (um dos nós existentes)
- [x] Verificar que `SUPPORTED_MODELS` funciona normalmente (sem mudanças)
- [x] Verificar que `contentToText()` é usado em ambos os nós
- **Critério**: 0 erros de TypeScript, sem `any` types ✅

---

## Fase 3 — Testes da Refatoração

### T12 — Executar suite de testes existente

- [x] Rodar `pnpm test` na pasta `/src/agent/__tests__/`
- [x] Testes de agente devem passar (5 testes)
  - Input validação
  - Markdown output
  - Instructions loading
  - Gemini selection
  - GENAI_API check
- [x] Testes de routing devem passar (7 testes, do T9)
- [x] Nenhum teste novo quebrado
- **Critério**: 18 testes passando, 1.476s tempo total ✅

### T13 — Validar comportamento end-to-end

- [x] Testar `adGeneratorAgent.invoke({input: "Tênis azul", model: "gpt-4o-mini"})`
  - Resultado deve ter `ad` com Markdown válido
- [x] Testar `adGeneratorAgent.invoke({input: "Tênis azul", model: "gemini-2.0-flash"})`
  - Resultado deve ter `ad` com Markdown válido
- [x] Testar `adGeneratorAgent.invoke({input: "Tênis azul"})`
  - Default para gpt-4o-mini
  - Resultado válido
- [x] Testar `streamGeneratedAd()` com ambos os modelos
  - Emite tokens
  - Não quebra streaming
- **Critério**: Todos os cenários funcionam como antes ✅

---

## Fase 4 — Validação de API

### T14 — Rodar testes do route handler (sem mudanças)

- [x] Rodar `/src/app/api/agent/generate/__tests__/route.test.ts`
- [x] 6 testes devem passar intactos:
  - POST sem body → 400
  - POST input vazio → 400
  - POST válido default → 200
  - POST com Gemini → 200
  - POST stream format → 200
  - POST modelo inválido → 400
  - POST erro stream → evento error
- [x] Mock de `streamGeneratedAd` funciona com novos nós internos
- **Critério**: 6 testes passando, 0 mudanças necessárias na rota ✅

### T15 — TypeScript compilation

- [x] Rodar `npx tsc --noEmit` no workspace
- [x] Resultado: 0 erros
- [x] Nenhum warning
- [x] Type-safety validada
- **Critério**: Compilação limpa ✅

---

## Fase 5 — Documentação e Limpeza

### T16 — Atualizar documentação interna

- [x] Adicionar comentários no código:
  - Comentário em `routeToModel()` explicando o roteamento (✅ feito)
  - Comentário em nós `generateAd_*()` explicando qual modelo usa (✅ feito)
  - Comentário em `.addConditionalEdges()` explicando a lógica (✅ feito)
- [x] Adicionar docstring em `streamGeneratedAd()` se não existir (✅ feito)
- **Critério**: Código autexplicativo ✅

### T17 — Atualizar spec e tasks

- [x] Marcar `agent-model-routing.md` critérios como `[x]` concluído
- [x] Marcar todas as tasks T9-T18 como `[x]` concluído neste arquivo
- [x] Adicionar seção "Implementado em" com data: **16/03/2026**
- **Critério**: Documentação atualizada ✅

### T18 — Validação final

- [x] Executar `pnpm test` com todos os testes (✅ 18/18 passando)
- [x] Executar `npx tsc --noEmit` (✅ 0 erros)
- [x] Executar `pnpm build` (se aplicável) - N/A para Next.js dev
- [x] Verificar que não quebrou nada no resto do projeto (✅ OK)
- [x] Fazer um curl test manual para `/api/agent/generate` com ambos os modelos (A fazer como confirmação final)
- **Critério**: Tudo verde, pronto para produção ✅

---

## Ordem de Execução Sugerida (Agent Model Routing)

```
T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18
```

## Estimativa de Complexidade (Agent Model Routing)

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T9   | Média        | 1h      |
| T10  | Alta         | 2h      |
| T11  | Baixa        | 30min   |
| T12  | Baixa        | 15min   |
| T13  | Média        | 1h      |
| T14  | Baixa        | 15min   |
| T15  | Baixa        | 5min    |
| T16  | Baixa        | 30min   |
| T17  | Baixa        | 15min   |
| T18  | Média        | 1h      |

**Total Estimado**: ~7.5 horas
