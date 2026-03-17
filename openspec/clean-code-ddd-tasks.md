# Tarefas: Refatoração com Clean Code, SOLID e DDD

**Spec**: `openspec/specs/clean-code-ddd-refactoring.md`

**Status**: Concluído  
**Total Estimado**: 12 horas  
**Data Início**: 16/03/2026  
**Data Conclusão**: 16/03/2026

---

## Fase 1: Setup Estrutura (1h)

### T1: Criar estrutura de pastas

- [x] Criar `/src/agent/domain/model/`
- [x] Criar `/src/agent/domain/service/`
- [x] Criar `/src/agent/domain/exception/`
- [x] Criar `/src/agent/application/graph/`
- [x] Criar `/src/agent/application/stream/`
- [x] Criar `/src/agent/infrastructure/state/`
- [x] Criar `/src/agent/__tests__/domain/`
- [x] Criar `/src/agent/__tests__/application/`

---

## Fase 2: Implementação Domain Layer (4h)

### T2: Criar SupportedModel.ts

- [x] Extrair `SUPPORTED_MODELS` array em arquivo separado
- [x] Extrair type `SupportedModel`
- [x] Implementar função guard: `isSupportedModel(value): boolean`
- [x] Remover `SUPPORTED_MODELS` e `SupportedModel` do `adGeneratorAgent.ts` (re-exportados)

### T3: Criar ModelConfig.ts e ModelRegistry.ts

- [x] Criar `ModelConfig.ts`
- [x] Criar `ModelRegistry.ts` com `configs`, `get()`, `isSupported()` e `default()`
- [x] Remover `MODEL_CONFIGS` de `adGeneratorAgent.ts`
- [x] Atualizar imports para usar nova estrutura

### T4: Criar AdGenerationRequest.ts

- [x] Criar Value Object `AdGenerationRequest` com `input`, `instructions`, `model`
- [x] Implementar `validate()`
- [x] Implementar factory `create(input, instructions, model?)`

### T5: Criar exceções de domínio

- [x] Criar `DomainException.ts`
- [x] Criar `ModelNotFoundException.ts`
- [x] Criar `InvalidAdFormatException.ts`
- [x] Mensagens claras em português

### T6: Criar InstructionService.ts

- [x] Criar classe `InstructionService` com `load(): Promise<string>`
- [x] Ler `src/agent/instructions.md`
- [x] Remover função solta antiga
- [x] Cobrir com testes unitários

### T7: Criar ModelInitializerService.ts

- [x] Criar classe `ModelInitializerService` com `ModelRegistry`
- [x] Implementar `initialize(...)` com providers concretos (`ChatOpenAI`/`ChatGoogleGenerativeAI`)
- [x] Lançar exceção de domínio para modelo inválido (via registry)
- [x] Cobrir com testes unitários

### T8: Criar AdGenerationService.ts

- [x] Criar classe `AdGenerationService`
- [x] Implementar `generate(request)` coordenando modelo + prompt chain
- [x] Retornar apenas ad (string)
- [x] Cobrir com testes unitários

### T9: Criar OutputValidationService.ts

- [x] Criar classe `OutputValidationService`
- [x] Implementar `validate(output)` para Markdown com `#`
- [x] Lançar `InvalidAdFormatException` quando inválido
- [x] Cobrir com testes unitários

---

## Fase 3: Implementação Application Layer (3h)

### T10: Criar AgentStateDefinition.ts

- [x] Mover `Annotation.Root()` para arquivo separado
- [x] Definir `AgentState` e `AgentStateType`
- [x] Exportar tipos para graph builder e testes

### T11: Criar MessageParser.ts

- [x] Criar `MessageParser.parse(content)`
- [x] Encapsular parse de conteúdo do stream
- [x] Tratar string, array e objeto com `text`
- [x] Remover `contentToText()` antigo

### T12: Criar AdGeneratorGraphBuilder.ts

- [x] Criar `AdGeneratorGraphBuilder`
- [x] Construir nodes com serviços injetados
- [x] Manter edges lineares
- [x] Retornar grafo compilável
- [x] Cobrir com testes

### T13: Criar AdStreamGenerator.ts

- [x] Criar `AdStreamGenerator`
- [x] Implementar stream com filtro do nó `generateAd`
- [x] Usar `MessageParser.parse()`
- [x] Validar saída final em Markdown
- [x] Encapsular `streamGeneratedAd()`
- [x] Cobrir com testes de aplicação

---

## Fase 4: Refatoração de Testes (2.5h)

### T14: Refatorar testes domain layer

- [x] `SupportedModel.test.ts`
- [x] `ModelRegistry.test.ts`
- [x] `AdGenerationRequest.test.ts`
- [x] `InstructionService.test.ts`
- [x] `ModelInitializerService.test.ts`
- [x] `AdGenerationService.test.ts`
- [x] `OutputValidationService.test.ts`

### T15: Refatorar testes application layer

- [x] `AdGeneratorGraphBuilder.test.ts`
- [x] `AdStreamGenerator.test.ts`
- [x] Suite de aplicação estável sem regressões
- [x] `route.test.ts` permanece passando

---

## Fase 5: Validação & Cleanup (1.5h)

### T16: Refatorar adGeneratorAgent.ts como facade

- [x] Consolidar `adGeneratorAgent.ts` como facade
- [x] Exportar `adGeneratorAgent` compilado
- [x] Exportar `streamGeneratedAd()` delegando ao `AdStreamGenerator`
- [x] Exportar `SupportedModel`, `SUPPORTED_MODELS`, `ModelRegistry`
- [x] Arquivo com <50 linhas (41 linhas)
- [x] Remover `@ts-ignore`

### T17: Validação e ajustes finais

- [x] Executar `pnpm test` (20 suites, 87 testes passando)
- [x] Executar `npx tsc --noEmit` (0 erros)
- [x] Verificar rota `/api/agent/generate` com resposta 200 em teste manual
- [x] Revisar aderência a DDD, SOLID e Clean Code
- [x] Atualizar checklist completo

---

## Checklist de Conclusão

- [x] Todos os 17 tasks marcados como concluídos
- [x] Estrutura DDD implementada conforme spec
- [x] Princípios SOLID aplicados
- [x] Clean code aplicado
- [x] Exceções específicas de domínio
- [x] Testes refatorados (domain + application)
- [x] TypeScript sem erros
- [x] Testes passando
- [x] API route funciona
- [x] Backward compatibility preservada
- [x] Arquivo atualizado com status e datas
