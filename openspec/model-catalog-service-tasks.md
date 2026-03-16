# Tasks: Serviço de Catálogo de Modelos

Spec de referência: `openspec/specs/model-catalog-service.md`
Spec obrigatória de padrões: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Estrutura e Contratos

### T1 — Criar contratos de domínio para catálogo de modelos

- [ ] Criar tipo `ChatModel` em `src/agent/domain/model/ChatModel.ts`
- [ ] Criar interface `IModelCatalogService` em `src/agent/domain/service/IModelCatalogService.ts`
- [ ] Criar interface `IModelsProvider` (porta para provider externo)
- [ ] Criar interface `IApiKeyRepository` (porta para busca de chave por usuário)
- **Critério**: contratos definidos sem dependência de infraestrutura

### T2 — Criar exceções e tipos de apoio

- [ ] Criar exceções específicas se necessário (ex.: parsing inválido)
- [ ] Garantir nomenclatura consistente e sem `any`
- **Critério**: tipagem estrita com erros de domínio claros

---

## Fase 2 — Infraestrutura

### T3 — Implementar provider Google Models

- [ ] Criar `GoogleModelsProvider` em `src/agent/infrastructure/providers/GoogleModelsProvider.ts`
- [ ] Implementar chamada para `/v1beta/models?key=`
- [ ] Implementar filtro por `generateContent`/`bidiGenerateContent`
- [ ] Excluir modelos `embedding` e `aqa`
- [ ] Mapear payload para estrutura de domínio
- **Critério**: provider retorna lista normalizada ou lista vazia em falha

### T4 — Implementar adapter de API key por usuário

- [ ] Criar `UserGenAiApiKeyRepository` adapter (ou equivalente no projeto)
- [ ] Implementar `findByUserId(userId)` / `getByUserId(userId)`
- [ ] Retornar chave nula quando usuário não possuir API key
- **Critério**: `ModelCatalogService` consegue obter chave por abstração

---

## Fase 3 — Aplicação

### T5 — Implementar `ModelCatalogService`

- [ ] Criar classe em `src/agent/application/service/ModelCatalogService.ts`
- [ ] Injetar `IModelsProvider`, `IApiKeyRepository` e configuração default
- [ ] Implementar `getAvailableModels(userId)`
- [ ] Implementar `getFreeModels(userId)` reutilizando `getAvailableModels`
- [ ] Implementar `getModelInfo(modelName, userId)` reutilizando `getAvailableModels`
- [ ] Garantir append do modelo default
- **Critério**: serviço funcional e desacoplado do agente

### T6 — Integrar serviço sem alterar o agente

- [ ] Expor `ModelCatalogService` para consumo por rotas/casos de uso
- [ ] Não alterar contrato público de `adGeneratorAgent`
- **Critério**: agente continua funcionando como antes

---

## Fase 4 — Testes

### T7 — Testes unitários do serviço

- [ ] Criar `ModelCatalogService.test.ts`
- [ ] Cenário: usuário sem API key -> `[]`
- [ ] Cenário: API sem campo `models` -> `[]`
- [ ] Cenário: erro de fetch -> `[]`
- [ ] Cenário: filtros removem `embedding`/`aqa`
- [ ] Cenário: append do modelo default
- [ ] Cenário: `getFreeModels` filtra corretamente
- [ ] Cenário: `getModelInfo` encontra por nome
- **Critério**: cobertura de comportamento principal do catálogo

### T8 — Testes de integração (opcional leve)

- [ ] Validar wiring do serviço com providers mockados
- [ ] Validar que integração não afeta endpoint atual de geração
- **Critério**: sem regressão da feature existente

---

## Fase 5 — Validação Final

### T9 — Checklist técnico

- [ ] Executar `pnpm test`
- [ ] Executar `npx tsc --noEmit`
- [ ] Revisar aderência a DDD/SOLID/Clean Code
- [ ] Confirmar ausência de `any` não justificado
- **Critério**: build limpo e testes verdes

### T10 — Documentação e status

- [ ] Atualizar status deste arquivo para concluído
- [ ] (Opcional) Consolidar resumo em `openspec/tasks.md`
- **Critério**: rastreabilidade completa da feature

---

## Ordem de execução sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
```

## Estimativa de complexidade

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T1   | Média        | 45min   |
| T2   | Baixa        | 20min   |
| T3   | Alta         | 1h30    |
| T4   | Média        | 45min   |
| T5   | Alta         | 1h30    |
| T6   | Baixa        | 20min   |
| T7   | Alta         | 1h30    |
| T8   | Média        | 30min   |
| T9   | Baixa        | 15min   |
| T10  | Baixa        | 10min   |

**Total Estimado**: ~7h 35min
