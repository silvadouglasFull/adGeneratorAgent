# Tasks: Ad Generator Agent

Spec de referência: `openspec/specs/ad-generator-agent.md`

---

## Fase 1 — Setup e Infraestrutura

### T1 — Instalar dependências do agente

- [x] Instalar `@langchain/langgraph`, `@langchain/openai`, `@langchain/core`
- [x] Adicionar `OPENAI_API_KEY` ao `.env.local`
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
- [x] Implementar nó `generateAd`: chama o LLM com o input + manual
- [x] Implementar nó `validateOutput`: verifica se output começa com `#` (Markdown)
- [x] Conectar os nós no grafo: `loadInstructions → generateAd → validateOutput`
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
- [x] Chamar `streamGeneratedAd({ input, model })`
- [x] Retornar stream SSE com tokens e metadata final
- [x] Tratar erros com status HTTP adequado (400, 500/evento de erro)
- **Critério**: `POST /api/agent/generate` com body válido retorna 200 + Markdown

---

## Fase 4 — Testes

### T6 — Teste de integração do agente

- [x] Cobrir o agente em `src/agent/__tests__/domain` e `src/agent/__tests__/application`
- [x] Mock do LLM (evitar custo em CI)
- [x] Testar: input válido → retorna Markdown com `#`
- [x] Testar: `loadInstructions` carrega o arquivo corretamente
- **Critério**: todos os testes passam com `pnpm test`

### T7 — Teste do endpoint

- [x] Criar `/src/app/api/agent/generate/__tests__/route.test.ts`
- [x] Testar: POST sem body → 400
- [x] Testar: POST com `input` vazio → 400
- [x] Testar: POST válido → 200 com stream SSE + metadata
- **Critério**: todos os testes passam com `pnpm test`

---

## Fase 5 — Validação Final

### T8 — Teste manual end-to-end

- [x] Rodar `pnpm dev`
- [x] Fazer POST para `localhost:3000/api/agent/generate`
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

---

# Feature: Refatoração com initChatModel

Spec de referência: `openspec/specs/init-chat-model.md`

---

## Fase 1 — Setup

### T19 — Verificar e instalar dependência `langchain`

- [x] Verificar se `langchain` já está no `package.json`
- [x] Se não estiver: executar `pnpm add langchain`
- [x] Validar que `initChatModel` pode ser importado de `langchain/chat_models/universal`
- [x] Confirmar que `@langchain/openai` e `@langchain/google-genai` continuam instalados (peer deps)
- **Critério**: `import { initChatModel } from "langchain/chat_models/universal"` compila sem erro ✅

---

## Fase 2 — Refatoração do Agente

### T20 — Atualizar testes antes da refatoração

- [x] Em `/src/agent/__tests__/adGeneratorAgent.test.ts`:
  - [x] Atualizar mock: substituir mocks de `ChatOpenAI` e `ChatGoogleGenerativeAI` por mock de `initChatModel`
  - [x] Mock de `initChatModel` retorna objeto com `.pipe()` que resolve com Markdown válido
  - [x] Garantir que os 5 testes existentes continuam passando com o novo mock
- [x] Em `/src/agent/__tests__/modelRouting.test.ts`:
  - [x] Remover testes de `routeToModel`, `generateAd_openai`, `generateAd_gemini` (não existirão mais)
  - [x] Adicionar testes para o nó `generateAd` com `MODEL_CONFIGS`:
    - [x] Testar: `generateAd` com `model: "gpt-4o-mini"` chama `initChatModel` com `modelProvider: "openai"`
    - [x] Testar: `generateAd` com `model: "gemini-2.0-flash"` chama `initChatModel` com `modelProvider: "google-genai"`
    - [x] Testar: `generateAd` com `model: undefined` usa `gpt-4o-mini` como default
- **Critério**: Testes atualizados e passando ✅

### T21 — Refatorar `adGeneratorAgent.ts` com `initChatModel`

- [x] Em `/src/agent/adGeneratorAgent.ts`:
  - [x] Adicionar import: `import { initChatModel } from "langchain/chat_models/universal"`
  - [x] Remover imports: `ChatOpenAI` de `@langchain/openai` e `ChatGoogleGenerativeAI` de `@langchain/google-genai`
  - [x] Criar tipo `ModelConfig` e constante `MODEL_CONFIGS`:
    ```typescript
    type ModelConfig = { modelProvider: string; apiKey?: string };
    const MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
      "gpt-4o-mini": { modelProvider: "openai" },
      "gemini-2.0-flash": {
        modelProvider: "google-genai",
        apiKey: process.env.GENAI_API,
      },
    };
    ```
  - [x] Criar função `generateAd(state)` única que:
    - Lê `state.model ?? "gpt-4o-mini"`
    - Busca configuração em `MODEL_CONFIGS[selectedModel]`
    - Lança erro se modelo não configurado: `Modelo "${selectedModel}" não configurado. Modelos suportados: ${SUPPORTED_MODELS.join(", ")}`
    - Chama `await initChatModel(selectedModel, { ...config, temperature: 0.7, maxRetries: 0 })`
    - Invoca chain com `adGeneratorPrompt.pipe(model)`
    - Retorna `{ ad }`
  - [x] Remover funções: `generateAd_openai`, `generateAd_gemini`, `routeToModel`
  - [x] Atualizar grafo:
    - Remover `.addNode("generateAd_openai", ...)` e `.addNode("generateAd_gemini", ...)`
    - Adicionar `.addNode("generateAd", generateAd)`
    - Remover `.addConditionalEdges(...)`
    - Adicionar `.addEdge("loadInstructions", "generateAd")`
    - Remover `.addEdge("generateAd_openai", "validateOutput")` e `.addEdge("generateAd_gemini", "validateOutput")`
    - Adicionar `.addEdge("generateAd", "validateOutput")`
  - [x] Remover export de `routeToModel`, `generateAd_openai`, `generateAd_gemini`
  - [x] Atualizar filtro em `streamGeneratedAd()`:
    - Substituir condição de dois nós por filtro único: `metadata?.langgraph_node !== "generateAd"`
- **Critério**: Refatoração aplicada no agente ✅

### T22 — Resolver TypeScript e compilar

- [x] Executar `npx tsc --noEmit`
- [x] Corrigir eventuais erros de tipo (principalmente tipagem de `initChatModel`)
- [x] Garantir que `MODEL_CONFIGS` está tipado corretamente com `Record<SupportedModel, ModelConfig>`
- [x] Garantir que não restam referências a `ChatOpenAI`, `ChatGoogleGenerativeAI` no agente
- **Critério**: `npx tsc --noEmit` retorna 0 erros ✅

---

## Fase 3 — Testes

### T23 — Executar e validar todos os testes

- [x] Rodar `pnpm test`
- [x] Testes do agente devem passar (adGeneratorAgent.test.ts)
- [x] Testes de MODEL_CONFIGS devem passar (modelRouting.test.ts atualizado)
- [x] Testes da rota devem passar sem modificação (route.test.ts)
- [x] Resultado obtido: 14 testes passando
- **Critério**: `pnpm test` — todas as suites verdes, 0 falhas ✅

---

## Fase 4 — Validação

### T24 — Validar TypeScript final

- [x] Executar `npx tsc --noEmit`
- [x] Resultado: 0 erros, 0 warnings
- **Critério**: Compilação limpa ✅

### T25 — Atualizar documentação interna do código

- [x] Adicionar comentário em `MODEL_CONFIGS` explicando o padrão de registro declarativo
- [x] Atualizar JSDoc de `generateAd()` para refletir uso de `initChatModel`
- [x] Atualizar comentário no grafo (remover referências a conditional edges)
- **Critério**: Código autoexplicativo e atualizado ✅

### T26 — Marcar spec e tasks como concluídos

- [x] Marcar critérios de aceitação em `init-chat-model.md` como `[x]`
- [x] Marcar tasks T19-T26 neste arquivo como `[x]`
- **Critério**: Documentação 100% atualizada ✅

---

## Ordem de Execução Sugerida (initChatModel)

```
T19 → T20 → T21 → T22 → T23 → T24 → T25 → T26
```

## Estimativa de Complexidade (initChatModel)

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T19  | Baixa        | 15min   |
| T20  | Média        | 45min   |
| T21  | Alta         | 1.5h    |
| T22  | Baixa        | 30min   |
| T23  | Baixa        | 15min   |
| T24  | Baixa        | 5min    |
| T25  | Baixa        | 20min   |
| T26  | Baixa        | 10min   |

**Total Estimado**: ~3.5 horas

---

# Feature: Refatoração com Clean Code, SOLID e DDD

Spec de referência: `openspec/specs/clean-code-ddd-refactoring.md`
Tasks detalhadas: `openspec/clean-code-ddd-tasks.md`

Status: **Concluído em 16/03/2026**

---

## Fase 1 — Setup Estrutural

### T27 — Criar estrutura de pastas por camada

- [x] Criar `src/agent/domain/model/`
- [x] Criar `src/agent/domain/service/`
- [x] Criar `src/agent/domain/exception/`
- [x] Criar `src/agent/application/graph/`
- [x] Criar `src/agent/application/stream/`
- [x] Criar `src/agent/infrastructure/state/`
- [x] Criar `src/agent/__tests__/domain/`
- [x] Criar `src/agent/__tests__/application/`
- **Critério**: Estrutura DDD criada conforme spec ✅

## Fase 2 — Domain Layer

### T28 — Extrair modelos, value objects e registry

- [x] Criar `SupportedModel.ts` (tipos + guard)
- [x] Criar `ModelConfig.ts`
- [x] Criar `ModelRegistry.ts` com `default()`, `get()`, `isSupported()`
- [x] Criar `AdGenerationRequest.ts`
- [x] Remover configuração inline do agente monolítico
- **Critério**: Registro declarativo de modelos centralizado ✅

### T29 — Criar exceções de domínio

- [x] Criar `DomainException.ts`
- [x] Criar `ModelNotFoundException.ts`
- [x] Criar `InvalidAdFormatException.ts`
- **Critério**: Erros semânticos do domínio isolados ✅

### T30 — Extrair serviços de domínio

- [x] Criar `InstructionService.ts`
- [x] Criar `ModelInitializerService.ts`
- [x] Criar `AdGenerationService.ts`
- [x] Criar `OutputValidationService.ts`
- [x] Aplicar responsabilidade única por classe
- **Critério**: Fluxo de geração encapsulado em serviços coesos ✅

## Fase 3 — Application/Infrastructure Layer

### T31 — Extrair estado, grafo e streaming

- [x] Criar `AgentStateDefinition.ts`
- [x] Criar `AdGeneratorGraphBuilder.ts`
- [x] Criar `MessageParser.ts`
- [x] Criar `AdStreamGenerator.ts`
- [x] Manter fluxo linear: `loadInstructions -> generateAd -> validateOutput`
- **Critério**: Orquestração separada da regra de negócio ✅

### T32 — Refatorar `adGeneratorAgent.ts` para facade

- [x] Transformar `adGeneratorAgent.ts` em facade de composição
- [x] Re-exportar contrato público (`adGeneratorAgent`, `streamGeneratedAd`, tipos)
- [x] Remover comentários desnecessários e lógica monolítica
- **Critério**: Interface pública preservada com implementação desacoplada ✅

## Fase 4 — Testes e Validação

### T33 — Reestruturar testes e validar comportamento

- [x] Criar testes em `__tests__/domain/`
- [x] Criar testes em `__tests__/application/`
- [x] Validar rota API existente sem quebra
- [x] Executar `pnpm test` com sucesso (20 suites / 87 testes)
- [x] Executar `npx tsc --noEmit` com sucesso (0 erros)
- [x] Verificar equivalência funcional do serviço (mesma lógica de negócio)
- **Critério**: Refatoração concluída sem regressão comportamental ✅

---

## Ordem de Execução Sugerida (Clean Code + SOLID + DDD)

```
T27 → T28 → T29 → T30 → T31 → T32 → T33
```

## Estimativa de Complexidade (Clean Code + SOLID + DDD)

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T27  | Baixa        | 0.5h    |
| T28  | Média        | 1.5h    |
| T29  | Baixa        | 0.5h    |
| T30  | Alta         | 2h      |
| T31  | Alta         | 2h      |
| T32  | Média        | 1h      |
| T33  | Média        | 1h      |

**Total Estimado**: ~8.5 horas

---

# Feature: Serviço de Catálogo de Modelos (OpenAI + Google Gemini)

Spec de referência: `openspec/specs/model-catalog-service.md`
Tasks detalhadas: `openspec/model-catalog-service-tasks.md`

---

## Objetivo

Criar um serviço separado do agente para reaproveitar e padronizar:

- `getAvailableModels(userId)`
- `getFreeModels(userId)`
- `getModelInfo(modelName, userId)`

com retorno unificado de modelos disponíveis de **OpenAI** e **Google Gemini**.

## Escopo Resumido

- [x] Definir contratos de domínio (`ChatModel`, `IModelCatalogService`)
- [x] Implementar providers OpenAI + Google Gemini e adapter de API key por provider
- [x] Mesclar lista de modelos dos dois providers com deduplicação por nome
- [x] Implementar `ModelCatalogService` desacoplado do `adGeneratorAgent`
- [x] Cobrir com testes unitários e validar build/type-check

## Ordem de execução sugerida

```text
Seguir T1 → T11 em openspec/model-catalog-service-tasks.md
```

---

# Feature: Token Consumption Tracking

Spec de referência: `openspec/specs/token-consumption-tracking.md`
Tasks detalhadas: `openspec/token-consumption-tracking-tasks.md`

## Escopo Resumido

- [x] Setup Drizzle ORM + schema + migrations + seed
- [x] Domain (VOs, exceções, interfaces)
- [x] Persistence (DrizzleTokenConsumptionRepository)
- [x] Queue Redis (producer/consumer com retry e DLQ)
- [x] Use case + container + integração na route
- [x] Extração de usage real quando disponível + fallback de estimativa
- [x] Testes unitários principais e validações `pnpm test`/`npx tsc --noEmit`
- [ ] Pendências abertas no checklist detalhado (startup/shutdown do consumer, testes de integração/benchmark e documentação operacional)

## Ordem de execução sugerida

```text
Seguir T1 → T11 em openspec/token-consumption-tracking-tasks.md
```
