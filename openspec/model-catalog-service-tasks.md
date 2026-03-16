# Tasks: Serviço de Catálogo de Modelos (OpenAI + Google Gemini)

Spec de referência: `openspec/specs/model-catalog-service.md`
Spec obrigatória de padrões: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Estrutura e Contratos

### T1 — Criar contratos de domínio para catálogo de modelos

- [ ] Criar tipo `ChatModel` em `src/agent/domain/model/ChatModel.ts`
- [ ] Criar interface `IModelCatalogService` em `src/agent/domain/service/IModelCatalogService.ts`
- [ ] Criar interface `IModelsProvider` (porta para provider externo)
- [ ] Criar interface `IApiKeyRepository` (porta para busca de chave por usuário e provider)
- **Critério**: contratos definidos sem dependência de infraestrutura

### T2 — Criar exceções e tipos de apoio

- [ ] Criar exceções específicas se necessário (ex.: parsing inválido)
- [ ] Garantir nomenclatura consistente e sem `any`
- **Critério**: tipagem estrita com erros de domínio claros

---

## Fase 2 — Infraestrutura

### T3 — Implementar provider Google Gemini Models

- [ ] Criar `GoogleModelsProvider` em `src/agent/infrastructure/providers/GoogleModelsProvider.ts`
- [ ] Implementar chamada para `/v1beta/models?key=`
- [ ] Implementar filtro por `generateContent`/`bidiGenerateContent`
- [ ] Excluir modelos `embedding` e `aqa`
- [ ] Mapear payload para estrutura de domínio
- **Critério**: provider retorna lista normalizada ou lista vazia em falha

### T4 — Implementar provider OpenAI Models

- [ ] Criar `OpenAIModelsProvider` em `src/agent/infrastructure/providers/OpenAIModelsProvider.ts`
- [ ] Implementar consulta dos modelos disponíveis na API da OpenAI
- [ ] Filtrar para modelos aptos a chat/generation no contexto da aplicação
- [ ] Mapear payload para estrutura de domínio `ChatModel`
- [ ] Definir fallback seguro (lista vazia) em caso de erro de integração
- **Critério**: provider OpenAI retorna lista normalizada ou lista vazia em falha

### T5 — Implementar adapter de API key por usuário

- [ ] Criar adapter de API key por usuário com suporte a providers (`openai`, `google-gemini`)
- [ ] Implementar busca de chave por `userId` e provider
- [ ] Retornar chave nula quando usuário não possuir API key do provider solicitado
- **Critério**: `ModelCatalogService` consegue obter as chaves por abstração

---

## Fase 3 — Aplicação

### T6 — Implementar `ModelCatalogService`

- [ ] Criar classe em `src/agent/application/service/ModelCatalogService.ts`
- [ ] Injetar providers (`OpenAIModelsProvider`, `GoogleModelsProvider`) via abstrações
- [ ] Injetar `IApiKeyRepository` e configuração default
- [ ] Implementar `getAvailableModels(userId)`
  - [ ] Consultar OpenAI
  - [ ] Consultar Google Gemini
  - [ ] Mesclar listas com deduplicação por `name`
- [ ] Implementar `getFreeModels(userId)` reutilizando `getAvailableModels`
- [ ] Implementar `getModelInfo(modelName, userId)` reutilizando `getAvailableModels`
- [ ] Garantir append de modelos default por provider (quando aplicável)
- **Critério**: serviço funcional e desacoplado do agente

### T7 — Integrar serviço sem alterar o agente

- [ ] Expor `ModelCatalogService` para consumo por rotas/casos de uso
- [ ] Não alterar contrato público de `adGeneratorAgent`
- **Critério**: agente continua funcionando como antes

---

## Fase 4 — Testes

### T8 — Testes unitários do serviço

- [ ] Criar `ModelCatalogService.test.ts`
- [ ] Cenário: usuário sem API key -> `[]`
- [ ] Cenário: API Google sem campo `models` -> `[]`
- [ ] Cenário: erro de fetch no provider Google -> `[]`
- [ ] Cenário: erro de fetch no provider OpenAI -> `[]`
- [ ] Cenário: filtros removem `embedding`/`aqa`
- [ ] Cenário: mescla modelos de OpenAI + Google Gemini
- [ ] Cenário: deduplicação por nome do modelo
- [ ] Cenário: append de default por provider
- [ ] Cenário: `getFreeModels` filtra corretamente
- [ ] Cenário: `getModelInfo` encontra por nome
- **Critério**: cobertura de comportamento principal do catálogo

### T9 — Testes de integração (opcional leve)

- [ ] Validar wiring do serviço com providers OpenAI/Google mockados
- [ ] Validar que integração não afeta endpoint atual de geração
- **Critério**: sem regressão da feature existente

---

## Fase 5 — Validação Final

### T10 — Checklist técnico

- [ ] Executar `pnpm test`
- [ ] Executar `npx tsc --noEmit`
- [ ] Revisar aderência a DDD/SOLID/Clean Code
- [ ] Confirmar ausência de `any` não justificado
- **Critério**: build limpo e testes verdes

### T11 — Documentação e status

- [ ] Atualizar status deste arquivo para concluído
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
