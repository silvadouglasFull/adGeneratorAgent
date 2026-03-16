# Tarefas: Refatoração com Clean Code, SOLID e DDD

**Spec**: `openspec/specs/clean-code-ddd-refactoring.md`

**Status**: Não iniciado  
**Total Estimado**: 12 horas  
**Data Início**: -  
**Data Conclusão**: -

---

## Fase 1: Setup Estrutura (1h)

### T1: Criar estrutura de pastas

- [ ] Criar `/src/agent/domain/model/`
- [ ] Criar `/src/agent/domain/service/`
- [ ] Criar `/src/agent/domain/exception/`
- [ ] Criar `/src/agent/application/graph/`
- [ ] Criar `/src/agent/application/stream/`
- [ ] Criar `/src/agent/infrastructure/state/`
- [ ] Criar `/src/agent/__tests__/domain/`
- [ ] Criar `/src/agent/__tests__/application/`

**Aceito quando**: Estrutura de pastas criada conforme diagrama na spec  
**Complexidade**: Trivial  
**Tempo**: 0.5h

---

## Fase 2: Implementação Domain Layer (4h)

### T2: Criar SupportedModel.ts

- [ ] Extrair `SUPPORTED_MODELS` array em arquivo separado
- [ ] Extrair type `SupportedModel`
- [ ] Implementar função guard: `isSupportedModel(value): boolean`
- [ ] Remover `SUPPORTED_MODELS` e `SupportedModel` do `adGeneratorAgent.ts` (serão re-exportados)

**Aceito quando**:

- Arquivo criado
- Type e guard funcionam corretamente
- Testes passam

**Complexidade**: Simples  
**Tempo**: 0.5h

### T3: Criar ModelConfig.ts e ModelRegistry.ts

- [ ] Criar `ModelConfig.ts`: Value Object com propriedades `{ modelProvider: string; apiKey?: string }`
- [ ] Criar `ModelRegistry.ts` com classe `ModelRegistry`:
  - [ ] Propriedade privada: `configs: Record<SupportedModel, ModelConfig>`
  - [ ] Método `get(modelName: SupportedModel): ModelConfig` → lança `ModelNotFoundException` se não existe
  - [ ] Método `isSupported(modelName: string): boolean`
  - [ ] Método estático: `default(): ModelRegistry` retorna instância com modelos padrão
- [ ] Remover `MODEL_CONFIGS` de `adGeneratorAgent.ts`
- [ ] Atualizar imports para usar nova estrutura

**Aceito quando**:

- Ambos os arquivos criados
- Registry carrega configurações corretamente
- Testes de `get()` e `isSupported()` passam
- `ModelNotFoundException` é lançado para modelo inválido

**Complexidade**: Média  
**Tempo**: 1h

### T4: Criar AdGenerationRequest.ts

- [ ] Criar Value Object `AdGenerationRequest` com propriedades imutáveis:
  - [ ] `input: string`
  - [ ] `instructions: string`
  - [ ] `model: SupportedModel | undefined`
- [ ] Implementar método `validate()`: valida se campos requeridos preenchidos
- [ ] Implementar factory: `AdGenerationRequest.create(input, instructions, model?)`

**Aceito quando**:

- Value Object criado
- Validações funcionam
- Testes unitários passam

**Complexidade**: Simples  
**Tempo**: 0.5h

### T5: Criar exceções de domínio

- [ ] Criar `DomainException.ts`: classe base estendendo `Error`
- [ ] Criar `ModelNotFoundException.ts` estendendo `DomainException`
- [ ] Criar `InvalidAdFormatException.ts` estendendo `DomainException`
- [ ] Ambas com mensagens claras em português

**Aceito quando**:

- Três arquivos criados
- Exceções herdam corretamente
- Mensagens são informativas

**Complexidade**: Trivial  
**Tempo**: 0.25h

### T6: Criar InstructionService.ts

- [ ] Criar classe `InstructionService`:
  - [ ] Método público assíncrono: `load(): Promise<string>`
  - [ ] Lê arquivo `src/agent/instructions.md`
  - [ ] Retorna conteúdo como string
  - [ ] Não exporta função solta (antes era `loadInstructions()`)
- [ ] Testes unitários

**Aceito quando**:

- Service criada e funciona
- Carrega arquivo corretamente
- Testes passam
- Remover `loadInstructions()` de `adGeneratorAgent.ts`

**Complexidade**: Simples  
**Tempo**: 0.5h

### T7: Criar ModelInitializerService.ts

- [ ] Criar classe `ModelInitializerService`:
  - [ ] Construtor aceita `ModelRegistry`
  - [ ] Método: `async initialize(modelName, config): Promise<LanguageModel>`
  - [ ] Chama `initChatModel()` com config extraída
  - [ ] Lança `ModelNotFoundException` via registry se modelo não existir
- [ ] Encapsula lógica de `generateAd()` atual (instanciação de modelo)
- [ ] Testes unitários (mock `initChatModel`)

**Aceito quando**:

- Service criada
- Inicializa modelo corretamente
- Lança exceção apropriada se modelo não encontrado
- Testes passam
- Lógica removida de `adGeneratorAgent.ts`

**Complexidade**: Média  
**Tempo**: 1h

### T8: Criar AdGenerationService.ts

- [ ] Criar classe `AdGenerationService`:
  - [ ] Construtor aceita `ModelInitializerService`, `ModelRegistry`, `adGeneratorPrompt`
  - [ ] Método: `async generate(request: AdGenerationRequest): Promise<string>`
  - [ ] Coordena: inicializa modelo → invoca chain (prompt.pipe(model))
  - [ ] Retorna apenas ad (string), sem validação
- [ ] Encapsula lógica de `generateAd()` atual (geração)
- [ ] Testes unitários

**Aceito quando**:

- Service criada
- Gera anúncio corretamente
- Testes passam
- Lógica removida de `generateAd()`

**Complexidade**: Média  
**Tempo**: 1h

### T9: Criar OutputValidationService.ts

- [ ] Criar classe `OutputValidationService`:
  - [ ] Método: `async validate(output: string): Promise<string>`
  - [ ] Verifica se começa com `#` (Markdown heading)
  - [ ] Retorna trimmed se válido
  - [ ] Lança `InvalidAdFormatException` se inválido
- [ ] Encapsula lógica de `validateOutput()` atual
- [ ] Testes unitários

**Aceito quando**:

- Service criada
- Valida formato corretamente
- Testes passam
- Lógica removida de `validateOutput()`

**Complexidade**: Simples  
**Tempo**: 0.5h

---

## Fase 3: Implementação Application Layer (3h)

### T10: Criar AgentStateDefinition.ts

- [ ] Mover `Annotation.Root()` para arquivo separado
- [ ] Definir tipos `AgentState` e `AgentStateType` (que eram inline)
- [ ] Exportar ambos para uso em graph builder e testes
- [ ] Remover do `adGeneratorAgent.ts`

**Aceito quando**:

- Arquivo criado
- Types definidos corretamente
- Importa em `AdGeneratorGraphBuilder` funciona

**Complexidade**: Trivial  
**Tempo**: 0.25h

### T11: Criar MessageParser.ts

- [ ] Criar classe `MessageParser` com método estático: `parse(content: unknown): string`
- [ ] Encapsula lógica de `contentToText()` atual
- [ ] Trata: strings, arrays, objetos com propriedade `text`
- [ ] Remover `contentToText()` de `adGeneratorAgent.ts`

**Aceito quando**:

- Class criada
- Parse funciona para todos os formatos
- Testes passam

**Complexidade**: Simples  
**Tempo**: 0.5h

### T12: Criar AdGeneratorGraphBuilder.ts

- [ ] Criar classe `AdGeneratorGraphBuilder`:
  - [ ] Método estático: `build(services: { instructionService, modeling, generation, validation }): StateGraph`
  - [ ] Cria nodes passando os serviços necessários (não funções diretas)
  - [ ] Adiciona edges lineares (sem conditional)
  - [ ] Retorna grafo compilado via `.compile()`
- [ ] Nodes usam serviços injetados via closure/função wrapper
- [ ] Testes: verificar estrutura grafo e edges

**Aceito quando**:

- Class criada
- Grafo com 3 nodes e 4 edges corretos
- Testes passam
- Grafo é compilável

**Complexidade**: Média  
**Tempo**: 1.5h

### T13: Criar AdStreamGenerator.ts

- [ ] Criar classe `AdStreamGenerator`:
  - [ ] Construtor aceita: `graph` (compilado), `MessageParser`
  - [ ] Método: `async *stream({ input, model }): AsyncGenerator<string, { ad }, void>`
  - [ ] Invoca grafo com `streamMode: "messages"`
  - [ ] Filtra eventos `langgraph_node === "generateAd"`
  - [ ] Usa `MessageParser.parse()` para extrair texto
  - [ ] Valida output final (Markdown)
  - [ ] Retorna ad final ou lança exceção
- [ ] Encapsula lógica de `streamGeneratedAd()` atual
- [ ] Testes: mock grafo, verificar tokens emitidos

**Aceito quando**:

- Class criada
- Stream funciona e emite tokens
- Output final validado
- Testes passam

**Complexidade**: Média  
**Tempo**: 1.5h

---

## Fase 4: Refatoração de Testes (2.5h)

### T14: Refatorar testes domain layer

- [ ] Criar `__tests__/domain/SupportedModel.test.ts`: testa guard
- [ ] Criar `__tests__/domain/ModelRegistry.test.ts`: testa `get()`, `isSupported()`, exceção
- [ ] Criar `__tests__/domain/AdGenerationRequest.test.ts`: testa validação
- [ ] Criar `__tests__/domain/InstructionService.test.ts`: testa `load()`
- [ ] Criar `__tests__/domain/ModelInitializerService.test.ts`: testa `initialize()`, exceção
- [ ] Criar `__tests__/domain/AdGenerationService.test.ts`: testa `generate()`
- [ ] Criar `__tests__/domain/OutputValidationService.test.ts`: testa `validate()`, exceção

**Aceito quando**:

- 7 arquivos de teste criados
- ~25-30 testes no total
- Todos passando
- Cobertura >90% para domain layer

**Complexidade**: Alta  
**Tempo**: 1.5h

### T15: Refatorar testes application layer

- [ ] Criar `__tests__/application/AdGeneratorGraphBuilder.test.ts`: testa estrutura grafo
- [ ] Criar `__tests__/application/AdStreamGenerator.test.ts`: testa stream e validação
- [ ] Mover/refatorar `__tests__/adGeneratorAgent.test.ts` → testes de integração (optional, ou remover)
- [ ] Atualizar `__tests__/route.test.ts` se necessário (deve passar transparentemente)

**Aceito quando**:

- 2-3 novos testes de aplicação
- ~10 testes no total
- Todos passando
- API route test ainda funciona

**Complexidade**: Média  
**Tempo**: 1h

---

## Fase 5: Validação & Cleanup (1.5h)

### T16: Refatorar adGeneratorAgent.ts como facade

- [ ] Remover todas as implementações (já estão em services)
- [ ] Importar e instanciar serviços necessários
- [ ] Exportar `adGeneratorAgent` compilado (instância do grafo)
- [ ] Exportar `streamGeneratedAd()` que retorna `AdStreamGenerator.stream()`
- [ ] Exportar tipos públicos: `SupportedModel`, `SUPPORTED_MODELS`, `ModelRegistry`
- [ ] Arquivo deve ter <50 linhas (facade pattern)
- [ ] Remover comentários desnecessários (nomenclatura fala por si)

**Aceito quando**:

- Arquivo é pequeno e claro
- Exportações públicas intactas
- Sem comentários desnecessários
- TypeScript: 0 erros

**Complexidade**: Média  
**Tempo**: 0.75h

### T17: Validação e ajustes finais

- [ ] Executar `pnpm test` → todos testes devem passar
- [ ] Executar `npx tsc --noEmit` → 0 erros
- [ ] Verificar API route funciona (curl ou browser test)
- [ ] Code review: SOLID, clean code, DDD aplicados em todos os arquivos
- [ ] Atualizar este arquivo de tasks marcando itens como `[x]`

**Aceito quando**:

- Testes: 100% passando (estimate: ~35-40 testes)
- TypeScript: 0 erros, 0 warnings
- API route: HTTP 200 com anúncio válido
- Backward compatibility: consumidores veem no change

**Complexidade**: Média  
**Tempo**: 0.75h

---

## Resumo de Saídas

### Arquivos Criados (13 novos)

**Domain**:

- `src/agent/domain/model/SupportedModel.ts`
- `src/agent/domain/model/ModelConfig.ts`
- `src/agent/domain/model/ModelRegistry.ts`
- `src/agent/domain/model/AdGenerationRequest.ts`
- `src/agent/domain/service/InstructionService.ts`
- `src/agent/domain/service/ModelInitializerService.ts`
- `src/agent/domain/service/AdGenerationService.ts`
- `src/agent/domain/service/OutputValidationService.ts`
- `src/agent/domain/exception/DomainException.ts`
- `src/agent/domain/exception/ModelNotFoundException.ts`
- `src/agent/domain/exception/InvalidAdFormatException.ts`

**Application**:

- `src/agent/application/graph/AdGeneratorGraphBuilder.ts`
- `src/agent/application/stream/MessageParser.ts`
- `src/agent/application/stream/AdStreamGenerator.ts`

**Infrastructure**:

- `src/agent/infrastructure/state/AgentStateDefinition.ts`

### Arquivos Modificados (1 arquivo)

- `src/agent/adGeneratorAgent.ts` → refatorado para 40-50 linhas como facade

### Arquivos de Teste (9 novos)

- `src/agent/__tests__/domain/*.test.ts` (7 arquivos)
- `src/agent/__tests__/application/*.test.ts` (2 arquivos)

---

## Checklist de Conclusão

- [ ] Todos os 17 tasks marcados como concluso
- [ ] Estrutura DDD implementada conforme spec
- [ ] Princípios SOLID aplicados
- [ ] Clean code: nomenclatura clara, sem comentários desnecessários
- [ ] Exceções específicas de domínio
- [ ] Testes refatorados (domain + application)
- [ ] TypeScript: 0 erros
- [ ] Testes passando: 35-40 testes
- [ ] API route funciona
- [ ] Backward compatibility preservada
- [ ] Este arquivo atualizado com datas e status
