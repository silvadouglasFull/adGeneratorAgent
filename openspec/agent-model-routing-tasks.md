# Tasks: Agent Model Routing com LangGraph

Spec de referência: `openspec/specs/agent-model-routing.md`

---

## Fase 1 — Preparação e Testes

### T1 — Criar testes para validar modelo routing

- [ ] Criar `/src/agent/__tests__/modelRouting.test.ts`
- [ ] Mock de ambos os modelos (ChatOpenAI e ChatGoogleGenerativeAI)
- [ ] Testar: `routeToModel(state)` com `model: "gpt-4o-mini"` retorna `"generateAd_openai"`
- [ ] Testar: `routeToModel(state)` com `model: "gemini-2.0-flash"` retorna `"generateAd_gemini"`
- [ ] Testar: `routeToModel(state)` com `model: undefined` retorna `"generateAd_openai"` (default)
- [ ] Testar: nó `generateAd_openai` invocado diretamente → output com `#`
- [ ] Testar: nó `generateAd_gemini` invocado diretamente → output com `#`
- **Critério**: 7 testes passando, cobertura de routing 100%

---

## Fase 2 — Refatoração do Agente

### T2 — Refatorar adGeneratorAgent.ts para usar conditional routing

- [ ] Em `/src/agent/adGeneratorAgent.ts`:
  - [ ] Remover função `getModelInstance()` (não mais necessária)
  - [ ] Criar função `routeToModel(state: AgentStateType): string` que:
    - Retorna `"generateAd_openai"` se `state.model === "gpt-4o-mini"` ou `undefined`
    - Retorna `"generateAd_gemini"` se `state.model === "gemini-2.0-flash"`
  - [ ] Criar nó `generateAd_openai(state)` que:
    - Instancia `ChatOpenAI` com `gpt-4o-mini`
    - Invoca chain com `adGeneratorPrompt`
    - Retorna ad
  - [ ] Criar nó `generateAd_gemini(state)` que:
    - Instancia `ChatGoogleGenerativeAI` com `gemini-2.0-flash`
    - Invoca chain com `adGeneratorPrompt`
    - Retorna ad (output idêntico a openai)
  - [ ] Atualizar grafo:
    - Remover `.addNode("generateAd", generateAd)`
    - Adicionar `.addNode("generateAd_openai", generateAd_openai)`
    - Adicionar `.addNode("generateAd_gemini", generateAd_gemini)`
    - Remover `.addEdge("loadInstructions", "generateAd")`
    - Adicionar `.addConditionalEdges("loadInstructions", routeToModel, {"generateAd_openai": "generateAd_openai", "generateAd_gemini": "generateAd_gemini"})`
    - Adicionar `.addEdge("generateAd_openai", "validateOutput")`
    - Adicionar `.addEdge("generateAd_gemini", "validateOutput")`
  - [ ] Manter `validateOutput` conectado a END
  - [ ] Manter `streamGeneratedAd()` sem mudanças (transparente para consumidor)
- **Critério**: Compilação sucede (`npx tsc --noEmit`)

### T3 — Validar signature das funções

- [ ] Verificar que ambos `generateAd_openai` e `generateAd_gemini` têm signature idêntica
- [ ] Tipagem TypeScript correta: `(state: AgentStateType) => Promise<Partial<AgentStateType>>`
- [ ] Verificar que `routeToModel()` retorna string válida (um dos nós existentes)
- [ ] Verificar que `SUPPORTED_MODELS` funciona normalmente (sem mudanças)
- [ ] Verificar que `contentToText()` é usado em ambos os nós
- **Critério**: 0 erros de TypeScript, sem `any` types

---

## Fase 3 — Testes da Refatoração

### T4 — Executar suite de testes existente

- [ ] Rodar `pnpm test` na pasta `/src/agent/__tests__/`
- [ ] Testes de agente devem passar (5 testes)
  - Input validação
  - Markdown output
  - Instructions loading
  - Gemini selection
  - GENAI_API check
- [ ] Testes de routing devem passar (7 testes, do T1)
- [ ] Nenhum teste novo quebrado
- **Critério**: 12 testes passando, 1.2s tempo total

### T5 — Validar comportamento end-to-end

- [ ] Testar `adGeneratorAgent.invoke({input: "Tênis azul", model: "gpt-4o-mini"})`
  - Resultado deve ter `ad` com Markdown válido
- [ ] Testar `adGeneratorAgent.invoke({input: "Tênis azul", model: "gemini-2.0-flash"})`
  - Resultado deve ter `ad` com Markdown válido
- [ ] Testar `adGeneratorAgent.invoke({input: "Tênis azul"})`
  - Default para gpt-4o-mini
  - Resultado válido
- [ ] Testar `streamGeneratedAd()` com ambos os modelos
  - Emite tokens
  - Não quebra streaming
- **Critério**: Todos os cenários funcionam como antes

---

## Fase 4 — Validação de API

### T6 — Rodar testes do route handler (sem mudanças)

- [ ] Rodar `/src/app/api/agent/generate/__tests__/route.test.ts`
- [ ] 6 testes devem passar intactos:
  - POST sem body → 400
  - POST input vazio → 400
  - POST válido default → 200
  - POST com Gemini → 200
  - POST stream format → 200
  - POST modelo inválido → 400
  - POST erro stream → evento error
- [ ] Mock de `streamGeneratedAd` funciona com novos nós internos
- **Critério**: 6 testes passando, 0 mudanças necessárias na rota

### T7 — TypeScript compilation

- [ ] Rodar `npx tsc --noEmit` no workspace
- [ ] Resultado: 0 erros
- [ ] Nenhum warning
- [ ] Type-safety validada
- **Critério**: Compilação limpa

---

## Fase 5 — Documentação e Limpeza

### T8 — Atualizar documentação interna

- [ ] Adicionar comentários no código:
  - Comentário em `routeToModel()` explicando o roteamento
  - Comentário em each `generateAd_*()` nó explicando qual modelo usa
  - Comentário em `.addConditionalEdges()` explicando a lógica
- [ ] Adicionar docstring em `streamGeneratedAd()` se não existir
- **Critério**: Código autoexplicativo

### T9 — Atualizar spec e tasks

- [ ] Marcar `agent-model-routing.md` critérios como `[x]` concluído
- [ ] Marcar todas as tasks T1-T8 como `[x]` concluído
- [ ] Adicionar seção "Implementado em" com data
- **Critério**: Documentação atualizada

### T10 — Validação final

- [ ] Executar `pnpm test` com todos os testes
- [ ] Executar `npx tsc --noEmit`
- [ ] Executar `pnpm build` (se aplicável)
- [ ] Verificar que não quebrou nada no resto do projeto
- [ ] Fazer um curl test manual para `/api/agent/generate` com ambos os modelos
- **Critério**: Tudo verde, pronto para produção

---

## Ordem de Execução Sugerida

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
```

## Estimativa de Complexidade

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T1   | Média        | 1h      |
| T2   | Alta         | 2h      |
| T3   | Baixa        | 30min   |
| T4   | Baixa        | 15min   |
| T5   | Média        | 1h      |
| T6   | Baixa        | 15min   |
| T7   | Baixa        | 5min    |
| T8   | Baixa        | 30min   |
| T9   | Baixa        | 15min   |
| T10  | Média        | 1h      |

**Total Estimado**: ~7.5 horas

---

## Checklist de Pré-Requisitos

Antes de começar a implementar:

- [x] Entender como `addConditionalEdges()` funciona em LangGraph
- [x] Revisar a spec `agent-model-routing.md` completamente
- [x] Ter acesso à documentação do LangGraph
- [x] Ambos os modelos (OpenAI e Google) funcionando no código atual
- [x] Suite de testes existentes passando

---

## Notas Técnicas

### Por que `addConditionalEdges()` em vez de `addEdge()`?

- `addEdge()` é estático: sempre vai pro mesmo nó
- `addConditionalEdges()` é dinâmico: funciona permite decidir durante execução qual nó ir baseado no estado
- Sintaxe: `.addConditionalEdges(source, routeFunction, mapping)`

### Por que nós separados para cada modelo?

- Evita if/else dentro do nó
- Cada nó é responsável por um modelo específico
- Fácil de debugar: saber exatamente qual nó foi executado
- Permite composição: no futuro, cada nó pode ter diferentes steps

### Backward Compatibility

- A função `streamGeneratedAd()` permanece idêntica
- O campo `AgentState` não muda
- A API `/api/agent/generate` não muda
- Consumidores não precisam saber que refatoramos internamente

---

## Padrão de Erro

Se um nó falhar, o erro will:

1. Ser capturado pelo try/catch em `/src/app/api/agent/generate/route.ts`
2. Emitido como evento SSE: `data: {"type":"error","error":"..."}`
3. Usuário vê o erro no front-end

Não há mudança no tratamento de erros.
