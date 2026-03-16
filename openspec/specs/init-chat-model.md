# Spec: Refatoração com initChatModel

Spec de referência anterior: `openspec/specs/agent-model-routing.md`

---

## Visão Geral

Refatorar o `adGeneratorAgent` para usar `initChatModel` da LangChain como inicializador universal de modelos, eliminando completamente qualquer lógica de mapeamento de modelos (ifs, nós separados, `addConditionalEdges`). Um único nó `generateAd` passa uma string de modelo e o LangChain resolve o provedor automaticamente.

## Problema Atual

A implementação atual (após `agent-model-routing.md`) usa `addConditionalEdges` com nós separados por modelo:

```typescript
// Dois nós separados
.addNode("generateAd_openai", generateAd_openai)
.addNode("generateAd_gemini", generateAd_gemini)

// Com routing condicional
.addConditionalEdges("loadInstructions", routeToModel, {
    generateAd_openai: "generateAd_openai",
    generateAd_gemini: "generateAd_gemini",
})
```

**Limitação residual:**

- Ainda requer criar um novo nó por modelo
- Routing condicional é configuração extra no grafo
- Cada novo modelo = novo nó + novo mapping no router

## Solução Proposta: `initChatModel`

`initChatModel` da LangChain (`langchain/chat_models/universal`) é um inicializador universal que recebe uma string de modelo e instancia o provedor correto automaticamente.

**Documentação:** [docs.langchain.com — initChatModel](https://docs.langchain.com/oss/javascript/langchain/models)

```typescript
import { initChatModel } from "langchain/chat_models/universal";

// LangChain resolve o provedor pelo prefixo ou pelo modelProvider
const model = await initChatModel("gpt-4o-mini", { modelProvider: "openai" });
const model = await initChatModel("gemini-2.0-flash", {
  modelProvider: "google-genai",
});

// Modelo inválido → lança erro automaticamente (sem if/else manual)
const model = await initChatModel("modelo-invalido", {
  modelProvider: "openai",
}); // → erro
```

### Registro Declarativo (MODEL_CONFIGS)

Em vez de ifs ou routing, usamos um **objeto de configuração** que mapeia nome do modelo → configurações do provedor:

```typescript
const MODEL_CONFIGS: Record<
  SupportedModel,
  { modelProvider: string; apiKey?: string }
> = {
  "gpt-4o-mini": {
    modelProvider: "openai",
    // OPENAI_API_KEY lida automaticamente pelo initChatModel
  },
  "gemini-2.0-flash": {
    modelProvider: "google-genai",
    apiKey: process.env.GENAI_API, // initChatModel espera GOOGLE_API_KEY; passamos explicitamente
  },
};
```

Adicionar novo modelo = **uma única linha** em `MODEL_CONFIGS`.

### Grafo Resultante

```
START → loadInstructions → generateAd → validateOutput → END
```

**Sem `addConditionalEdges`. Sem nós separados. Grafo linear e simples.**

## Considerações Técnicas

### Env Var: `GENAI_API` vs `GOOGLE_API_KEY`

`initChatModel` para `google-genai` lê por padrão `GOOGLE_API_KEY`. O projeto usa `GENAI_API`.
Solução: passar `apiKey` explicitamente no `MODEL_CONFIGS` para Google.

### Dependências

- `langchain` (pacote principal — inclui `initChatModel`)
- `@langchain/openai` (já instalado — peer dependency)
- `@langchain/google-genai` (já instalado — peer dependency)

Verificar se `langchain` já está instalado antes de instalar.

### Streaming

`initChatModel` retorna um `BaseChatModel` compatível com `.pipe()` e streaming — sem mudanças na função `streamGeneratedAd`.

### Validação de Modelo Inválido

Quando `selectedModel` não existe em `MODEL_CONFIGS`, lançamos erro antes de chamar `initChatModel`:

```typescript
const config = MODEL_CONFIGS[selectedModel];
if (!config) {
  throw new Error(
    `Modelo "${selectedModel}" não configurado. Modelos suportados: ${SUPPORTED_MODELS.join(", ")}`,
  );
}
```

## Arquitetura Resultante

```typescript
// Registro declarativo
const MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
  "gpt-4o-mini": { modelProvider: "openai" },
  "gemini-2.0-flash": {
    modelProvider: "google-genai",
    apiKey: process.env.GENAI_API,
  },
};

// Único nó de geração
async function generateAd(state: AgentStateType) {
  const selectedModel = state.model ?? "gpt-4o-mini";
  const config = MODEL_CONFIGS[selectedModel];

  if (!config) throw new Error(`Modelo "${selectedModel}" não configurado.`);

  const model = await initChatModel(selectedModel, {
    ...config,
    temperature: 0.7,
    maxRetries: 0,
  });

  const chain = adGeneratorPrompt.pipe(model);
  const response = await chain.invoke({
    instructions: state.instructions,
    input: state.input,
  });
  const ad =
    typeof response.content === "string"
      ? response.content
      : String(response.content);
  return { ad };
}

// Grafo linear, sem routing condicional
const graph = new StateGraph(AgentState)
  .addNode("loadInstructions", loadInstructions)
  .addNode("generateAd", generateAd) // Único nó de geração
  .addNode("validateOutput", validateOutput)
  .addEdge(START, "loadInstructions")
  .addEdge("loadInstructions", "generateAd") // Edge estático, sem condição
  .addEdge("generateAd", "validateOutput")
  .addEdge("validateOutput", END);
```

## Comparação: antes vs. depois

| Aspecto                  | Agent Model Routing (atual)               | initChatModel (novo)         |
| ------------------------ | ----------------------------------------- | ---------------------------- |
| **Nós de modelo**        | `generateAd_openai` + `generateAd_gemini` | Um único `generateAd`        |
| **Routing**              | `addConditionalEdges` + `routeToModel()`  | Removido completamente       |
| **Adicionar modelo**     | Novo nó + mapping no router               | Uma linha em `MODEL_CONFIGS` |
| **Grafo**                | Ramificado                                | Linear                       |
| **Erro modelo inválido** | Antes do grafo (na rota)                  | Dentro do nó `generateAd`    |
| **Imports**              | `ChatOpenAI` + `ChatGoogleGenerativeAI`   | `initChatModel`              |

## Critérios de Aceitação

- [x] `langchain` instalado como dependência (verificar se já presente)
- [x] Nó único `generateAd` usa `initChatModel` com `MODEL_CONFIGS`
- [x] `MODEL_CONFIGS` é um objeto declarativo (sem ifs)
- [x] Remover `generateAd_openai`, `generateAd_gemini`, `routeToModel` do agente
- [x] Remover `addConditionalEdges` do grafo
- [x] Grafo usa `.addEdge` estático: `loadInstructions → generateAd`
- [x] `streamGeneratedAd()` filtra por nó `generateAd` (nome único restaurado)
- [x] Modelo inválido lança erro com mensagem clara dentro do nó
- [x] Importações de `ChatOpenAI` e `ChatGoogleGenerativeAI` removidas do agente
- [x] Testes atualizam mock para `initChatModel` em vez de providers individuais
- [x] `pnpm test` passa com todos os testes existentes
- [x] `npx tsc --noEmit` retorna 0 erros

## Status de Implementação

✅ **Implementado em**: 16/03/2026

- Agente refatorado para um único nó `generateAd` com `initChatModel`
- Grafo simplificado: `START → loadInstructions → generateAd → validateOutput → END`
- `MODEL_CONFIGS` adicionado como registro declarativo de modelos
- Testes atualizados e aprovados (14/14)
- TypeScript validado sem erros

## Benefícios

1. **Grafo mais simples**: linear, sem branches
2. **Um único ponto de extensão**: `MODEL_CONFIGS` — adicionar modelo é uma linha
3. **Menos código**: remove nós, função router, conditional edges
4. **Padrão LangChain oficial**: usa API pública estável
5. **Erro claro**: modelo não configurado falha imediatamente com mensagem explícita

## Fora do Escopo

- Mudanças na API (`/api/agent/generate/route.ts`)
- Mudanças no frontend (`page.tsx`)
- Mudanças no `SUPPORTED_MODELS` export (permanece igual)
- Mudanças no `streamGeneratedAd()` além do nome do nó no filtro
