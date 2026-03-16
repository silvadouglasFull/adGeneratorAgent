# Tasks: Serviço de Catálogo de Modelos (OpenAI + Google Gemini)

Spec de referência: `openspec/specs/model-catalog-service.md`
Spec obrigatória de padrões: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Estrutura e Contratos

### T1 — Criar contratos de domínio para catálogo de modelos

- [x] Criar tipo `ChatModel` em `src/agent/domain/model/ChatModel.ts`
- [x] Criar interface `IModelCatalogService` em `src/agent/domain/service/IModelCatalogService.ts`
- [x] Criar interface `IModelsProvider` (porta para provider externo)
- [x] Criar interface `IApiKeyRepository` (porta para busca de chave por usuário e provider)
- **Critério**: contratos definidos sem dependência de infraestrutura

### T2 — Criar exceções e tipos de apoio

- [x] Criar exceções específicas se necessário (ex.: parsing inválido)
- [x] Garantir nomenclatura consistente e sem `any`
- **Critério**: tipagem estrita com erros de domínio claros

---

## Fase 2 — Infraestrutura

### T3 — Implementar provider Google Gemini Models

- [x] Criar `GoogleModelsProvider` em `src/agent/infrastructure/providers/GoogleModelsProvider.ts`
- [x] Implementar chamada para `/v1beta/models?key=`
- [x] Implementar filtro por `generateContent`/`bidiGenerateContent`
- [x] Excluir modelos `embedding` e `aqa`
- [x] Mapear payload para estrutura de domínio
- **Critério**: provider retorna lista normalizada ou lista vazia em falha

### T4 — Implementar provider OpenAI Models

- [x] Criar `OpenAIModelsProvider` em `src/agent/infrastructure/providers/OpenAIModelsProvider.ts`
- [x] Implementar consulta dos modelos disponíveis na API da OpenAI
- [x] Filtrar para modelos aptos a chat/generation no contexto da aplicação
- [x] Mapear payload para estrutura de domínio `ChatModel`
- [x] Definir fallback seguro (lista vazia) em caso de erro de integração
- **Critério**: provider OpenAI retorna lista normalizada ou lista vazia em falha

### T5 — Implementar adapter de API key por usuário

- [x] Criar adapter de API key por usuário com suporte a providers (`openai`, `google-gemini`)
- [x] Implementar busca de chave por `userId` e provider
- [x] Retornar chave nula quando usuário não possuir API key do provider solicitado
- **Critério**: `ModelCatalogService` consegue obter as chaves por abstração

---

## Fase 3 — Aplicação

### T6 — Implementar `ModelCatalogService`

- [x] Criar classe em `src/agent/application/service/ModelCatalogService.ts`
- [x] Injetar providers (`OpenAIModelsProvider`, `GoogleModelsProvider`) via abstrações
- [x] Injetar `IApiKeyRepository` e configuração default
- [x] Implementar `getAvailableModels(userId)`
  - [x] Consultar OpenAI
  - [x] Consultar Google Gemini
  - [x] Mesclar listas com deduplicação por `name`
- [x] Implementar `getFreeModels(userId)` reutilizando `getAvailableModels`
- [x] Implementar `getModelInfo(modelName, userId)` reutilizando `getAvailableModels`
- [x] Garantir append de modelos default por provider (quando aplicável)
- **Critério**: serviço funcional e desacoplado do agente

### T7 — Integrar serviço sem alterar o agente

- [x] Expor `ModelCatalogService` para consumo por rotas/casos de uso
- [x] Não alterar contrato público de `adGeneratorAgent`
- **Critério**: agente continua funcionando como antes

---

## Fase 4 — Testes

### T8 — Testes unitários do serviço

- [x] Criar `ModelCatalogService.test.ts`
- [x] Cenário: usuário sem API key -> `[]`
- [x] Cenário: API Google sem campo `models` -> `[]`
- [x] Cenário: erro de fetch no provider Google -> `[]`
- [x] Cenário: erro de fetch no provider OpenAI -> `[]`
- [x] Cenário: filtros removem `embedding`/`aqa`
- [x] Cenário: mescla modelos de OpenAI + Google Gemini
- [x] Cenário: deduplicação por nome do modelo
- [x] Cenário: append de default por provider
- [x] Cenário: `getFreeModels` filtra corretamente
- [x] Cenário: `getModelInfo` encontra por nome
- **Critério**: cobertura de comportamento principal do catálogo

### T9 — Testes de integração (opcional leve)

- [x] Validar wiring do serviço com providers OpenAI/Google mockados
- [x] Validar que integração não afeta endpoint atual de geração
- **Critério**: sem regressão da feature existente

---

## Fase 5 — Validação Final

### T10 — Checklist técnico

- [x] Executar `pnpm test`
- [x] Executar `npx tsc --noEmit`
- [x] Revisar aderência a DDD/SOLID/Clean Code
- [x] Confirmar ausência de `any` não justificado
- **Critério**: build limpo e testes verdes

### T11 — Documentação e status

- [x] Atualizar status deste arquivo para concluído
- [ ] (Opcional) Consolidar resumo em `openspec/tasks.md`
- **Critério**: rastreabilidade completa da feature

---

## Ordem de execução sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11
```

## Estimativa de complexidade

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T1   | Média        | 45min   |
| T2   | Baixa        | 20min   |
| T3   | Alta         | 1h30    |
| T4   | Alta         | 1h15    |
| T5   | Média        | 45min   |
| T6   | Alta         | 1h45    |
| T7   | Baixa        | 20min   |
| T8   | Alta         | 1h45    |
| T9   | Média        | 30min   |
| T10  | Baixa        | 15min   |
| T11  | Baixa        | 10min   |

**Total Estimado**: ~9h 20min
