# Spec: Agent Model Routing com LangGraph

## Visão Geral

Refatorar o `adGeneratorAgent` para usar LangGraph conditional routing (`addConditionalEdges`) ao invés de lógica if/else para decidir qual instância de IA usar. Isso melhora a escalabilidade, mantibilidade e permite suportar múltiplos modelos de forma declarativa no grafo.

## Problema Atual

O código atual no `adGeneratorAgent.ts` usa uma função `getModelInstance()` que contém lógica condicional (if/else) para instanciar o modelo correto:

```typescript
function getModelInstance(selectedModel: SupportedModel) {
    if (selectedModel === "gemini-2.0-flash") {
        return new ChatGoogleGenerativeAI({...});
    }
    return new ChatOpenAI({...});
}
```

**Limitações:**

- Cada novo modelo requer adicionar um novo if/else
- Lógica de modelo misturada na função `generateAd`
- Difícil de testar isoladamente
- Menos flexível para composição de chains

## Solução Proposta

Usar LangGraph `addConditionalEdges` para criar nós específicos para cada modelo e rotear o fluxo baseado no estado `model`:

```
          ┌─────────────────────────┐
          │  loadInstructions       │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  routeToModel()         │
          │  (condicional)          │
          └─┬────────────┬──────────┘
            │            │
   ┌────────▼──┐  ┌──────▼────────┐
   │generateAd │  │generateAd     │
   │_gpt4o     │  │_gemini        │
   │(OpenAI)   │  │(Google)       │
   └────────┬──┘  └───────┬───────┘
            │             │
            └─────┬───────┘
                  │
          ┌───────▼────────┐
          │validateOutput  │
          └────────┬───────┘
                   │
                  END
```

## Arquitetura Proposta

1. **Nó `loadInstructions`**: Sem mudanças (continua existindo)
2. **Função `routeToModel(state)`**: Nova função que decide para qual nó ir baseado em `state.model`
3. **Nó `generateAd_openai`**: Gera anúncio usando ChatOpenAI (gpt-4o-mini)
4. **Nó `generateAd_gemini`**: Gera anúncio usando ChatGoogleGenerativeAI (gemini-2.0-flash)
5. **Nó `validateOutput`**: Sem mudanças (continua existindo)
6. **`addConditionalEdges`**: Conecta `loadInstructions` → roteamento → nós específicos do modelo

## Critérios de Aceitação

- [x] O grafo usa `addConditionalEdges()` para roteamento baseado em `state.model`
- [x] Função `routeToModel(state)` retorna string com nome do nó dinâmico
- [x] Nó `generateAd_openai` existe e gera anúncio com OpenAI (gpt-4o-mini)
- [x] Nó `generateAd_gemini` existe e gera anúncio com Google (gemini-2.0-flash)
- [x] Ambos os nós produzem output idêntico em formato Markdown válido
- [x] Nó `validateOutput` valida output após qualquer nó de modelo
- [x] Função `getModelInstance()` é removida (lógica migrada para nós)
- [x] Função `streamGeneratedAd()` continua funcionando igual (sem mudanças na API)
- [x] TypeScript type-safe: modelo inválido não pode ser passado ao grafo
- [x] Testes mantêm cobertura 100% (modelos OpenAI e Google)
- [x] Todos os testes existentes continuam passando sem modificação no consumidor

## Benefícios

1. **Escalabilidade**: Adicionar novo modelo = apenas um novo nó, sem if/else
2. **Clareza**: Grafo visual mostra exatamente qual caminho cada modelo toma
3. **Testabilidade**: Cada nó de modelo pode ser testado isoladamente
4. **Manutenibilidade**: Lógica de modelo concentrada em um único lugar (a função `routeToModel`)
5. **Flexibilidade**: Suporta padrões avançados (fallback, retry, agregação de múltiplos modelos)

## Contrato

### Input

Sem mudanças:

```typescript
streamGeneratedAd({ input: string, model?: SupportedModel })
```

### Output

Sem mudanças: continua sendo um `AsyncGenerator<string>` que emite tokens

### Mudanças Internas

- Remover função `getModelInstance()`
- Substituir nó único `generateAd` por múltiplos nós (`generateAd_openai`, `generateAd_gemini`, etc.)
- Adicionar função `routeToModel()` que retorna nome do nó
- Usar `addConditionalEdges()` no lugar de `.addEdge()`

## Considerações Técnicas

- **Estado**: O campo `model` no `AgentState` já existe, será usado para roteamento
- **Streaming**: Continua funcionando normalmente, cada nó emite mensagens ao stream
- **Erros**: Tratados identicamente em ambos os modelos (LLM error → evento `error` no SSE)
- **Temperatura**: Mantida em 0.7 para ambos os modelos, pode ser parametrizada futuramente
- **maxRetries**: Mantido em 0 em ambos os modelos (comportamento atual)

## Futuro (Escopo Fora)

Essas funcionalidades ficam para uma extensão futura:

- Suporte a mais modelos (Claude, Llama, etc.)
- Fallback automático se um modelo falhar
- Seleção dinâmica de temperatura por modelo
- Roteamento baseado em custo, latência ou qualidade
- Uso de `Command` para inter-comunicação entre nós
