# Tasks: Token Consumption Tracking Implementation

**Spec**: `openspec/specs/token-consumption-tracking.md`

## Status Atual (16/03/2026)

### Núcleo entregue (produção atual)

- [x] Fases 1 a 6 implementadas com integração na route e processamento assíncrono
- [x] Testes unitários de domínio/aplicação/infraestrutura implementados e passando
- [x] Validações de projeto executadas (`pnpm test` e `npx tsc --noEmit`)

### Pendências reais (não bloqueantes para o core atual)

- [x] Hardening de startup/shutdown do consumer fora de lazy init
- [x] Testes de integração E2E com Redis + PostgreSQL reais
- [ ] Benchmark de throughput
- [x] Documentação operacional (`README` da feature + plano de extração)

---

## Fase 1: Setup Banco de Dados (Drizzle ORM)

### T1.1 - Configurar Drizzle ORM e PostgreSQL

**Acceptance Criteria:**

- [x] `drizzle-orm` e `drizzle-kit` instalados (`pnpm add`)
- [x] `drizzle.config.ts` criado na raiz com conexão PostgreSQL
- [x] Variáveis de ambiente configuradas (`.env.local`)
- [x] `pnpm drizzle-kit generate` roda sem erros
- [x] Conexão com banco testada (conexão simples)

**Detalhes:**

- Usar `postgres` driver (não `better-sqlite3`)
- Pool de conexões configurado (min: 2, max: 5)
- Timezone UTC obrigatório

---

### T1.2 - Criar Schema Drizzle para Token Consumption

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/db/schema.ts` criado
- [x] Tabela `token_consumptions` definida com:
  - `id`: UUID primary key
  - `requestId`: UUID unique (idempotência)
  - `modelUsed`: enum (gpt-4o-mini, gemini-2.0-flash)
  - `inputTokens`: integer
  - `outputTokens`: integer
  - `totalTokens`: computed (input + output)
  - `timestamp`: timestamp with timezone
  - `status`: enum (success, failed)
  - `errorMessage`: nullable text
  - `createdAt`: timestamp with timezone
  - `updatedAt`: timestamp with timezone
- [x] Índices criados:
  - Compound: `(requestId, status)` para queries rápidas
  - Single: `timestamp` para rangequeries
  - Single: `modelUsed` para agregações
- [x] Schema compila sem erros TypeScript

**Detalhes:**

- Usar `pgTable` do Drizzle
- Timestamps automáticos (via `sql` default)
- Enum com Drizzle ou string Union validado em service

---

### T1.3 - Gerar e Executar Migrations

**Acceptance Criteria:**

- [x] Comando `pnpm drizzle-kit generate` cria migration em `src/tokenConsumption/infrastructure/db/migrations/`
- [x] Migration é válida (verifica syntax SQL)
- [x] Arquivo `src/tokenConsumption/infrastructure/db/migrate.ts` criado (helper para rodar migrations)
- [x] `pnpm drizzle-kit push` executa com sucesso
- [x] Tabela `token_consumptions` existe no PostgreSQL

**Detalhes:**

- Migrations devem ser versionadas (git)
- Script `pnpm db:migrate` adicionado em `package.json`

---

### T1.4 - Criar Seed de Dados Iniciais

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/db/seeds/token_consumption.seed.ts` criado
- [x] Seed insere 10-20 registros fake (histórico exemplo)
- [x] Seed é idempotente (verifica se já rodou ou usa fixtures)
- [x] Script `pnpm db:seed` adicionado em `package.json`
- [x] Seed executa sem erro

**Detalhes:**

- Modelos: gpt-4o-mini (60%), gemini-2.0-flash (40%)
- Tokens: variação realista (100-1000 input, 200-2000 output)
- Datas: últimos 7 dias (para testes de período)

---

## Fase 2: Domain Layer (DDD)

### T2.1 - Criar Value Objects de Domínio

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/domain/model/TokenConsumptionEvent.ts` criado
- [x] Class imutável com:
  - Constructor privado
  - Factory method `create()` com validações
  - Getters apenas (sem setters)
  - `equals()` para comparação
  - `toString()` para debugging
- [x] Validações:
  - `requestId` é UUID válido
  - `modelUsed` é um dos suportados (`SupportedModel`)
  - `inputTokens`, `outputTokens` > 0
  - `timestamp` no passado/presente
- [x] Exceções lançadas em caso de validação inválida
- [x] Arquivo `src/tokenConsumption/domain/model/TokenAggregation.ts` criado
- [x] Testes: `src/tokenConsumption/__tests__/domain/model/TokenConsumptionEvent.test.ts`

**Detalhes:**

- Não usar `any` type
- Value Object é imutável (Readonly<>)
- Factory valida sempre antes de instanciar

---

### T2.2 - Definir Exceções de Domínio

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/domain/exception/TokenConsumptionException.ts` (base)
- [x] Exceções específicas:
  - `TokenConsumptionRepositoryException`
  - `InvalidTokenConsumptionEventException`
  - `QueueConsumerException`
- [x] Cada exceção herda de `TokenConsumptionException`
- [x] Construtores aceitam `message` e `originalError?`
- [x] Sem comentários desnecessários

**Detalhes:**

- Extends `Error` nativo
- Mensagens claras e contextualizadas

---

### T2.3 - Definir Interfaces (Portas) de Repositório

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/domain/service/ITokenConsumptionRepository.ts`
- [x] Interface com métodos:
  - `save(event): Promise<void>`
  - `getTotalTokensByModel(model): Promise<number>`
  - `getTotalTokensByPeriod(start, end): Promise<TokenAggregation>`
  - `getByRequestId(id): Promise<TokenConsumptionEvent | null>`
  - `getFailedEvents(limit): Promise<TokenConsumptionEvent[]>`
- [x] Types exportados e usados em testes

**Detalhes:**

- Sem implementação, apenas contrato
- Retorna domain objects (TokenConsumptionEvent, TokenAggregation)

---

## Fase 3: Infrastructure Layer - Persistence

### T3.1 - Implementar TokenConsumptionRepository com Drizzle

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/persistence/DrizzleTokenConsumptionRepository.ts`
- [x] Class implementa `ITokenConsumptionRepository`
- [x] Constructor injeta dependência `db: Database`
- [x] Todos os métodos implementados:
  - `save()` com idempotência via `requestId` (INSERT OR UPDATE)
  - `getTotalTokensByModel()` com SQL SUM
  - `getTotalTokensByPeriod()` com WHERE timestamp BETWEEN
  - `getByRequestId()` com SELECT simples
  - `getFailedEvents()` com WHERE status = 'failed'
- [x] Tratamento de erros:
  - Unique constraint violation (requestId duplicado) → silenciosamente ignora (idempotência)
  - Query error → lança `TokenConsumptionRepositoryException`
- [x] Testes: `src/tokenConsumption/__tests__/infrastructure/DrizzleTokenConsumptionRepository.test.ts`
  - Mocks de `db` (fake Drizzle responses)
  - Testes de nominal cases
  - Testes de error cases

**Detalhes:**

- Usar prepared statements (Drizzle sql)
- Sem raw queries
- Timezone handling consistente (sempre UTC)

---

### T3.2 - Criar Client Database Singleton

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/db/client.ts` (ou similar)
- [x] Exporta instância única `db: Database`
- [x] Usa `process.env.DATABASE_URL` (validado)
- [x] Pool de conexões configurado
- [x] Inicialização apenas uma vez (singleton pattern)

**Detalhes:**

- Pode ser reutilizado em outras camadas
- Exporta também `migrate()` função

---

## Fase 4: Infrastructure Layer - Queue (Redis)

### T4.1 - Configurar Redis Client

**Acceptance Criteria:**

- [x] Biblioteca `ioredis` instalada (`pnpm add ioredis`)
- [x] Arquivo `src/tokenConsumption/infrastructure/queue/redis-client.ts`
- [x] Client singleton exportado
- [x] Usa `process.env.REDIS_URL` (ou localhost:6379 default)
- [x] Manejo de conexão/desconexão
- [x] Testes de conectividade simples

**Detalhes:**

- Redis para fila (não para cache de tokens)
- Pool não necessário (ioredis gerencia internamente)

---

### T4.2 - Implementar Token Consumption Queue Producer

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueProducer.ts`
- [x] Class implementa `ITokenConsumptionQueueProducer`
- [x] Constructor injeta `redis: Redis`
- [x] Método `enqueue(event)`:
  - Serializa `TokenConsumptionEvent` para JSON
  - Usa `redis.rpush('token_consumption:queue', json)`
  - Não bloqueia (fire-and-forget, sem await da persistência)
  - Lança `QueueConsumerException` se falha
- [x] Testes: `src/tokenConsumption/__tests__/infrastructure/RedisTokenConsumptionQueueProducer.test.ts`
  - Mock de Redis (redis-mock ou jest mock)
  - Testes de enqueue sucesso
  - Testes de enqueue failure

**Detalhes:**

- Fire-and-forget: não aguarda DB, apenas enfileira
- JSON usado (não MessagePack, por simplicidade)
- Erro em enqueue lança exception (caller decide retry)

---

### T4.3 - Implementar Token Consumption Queue Consumer

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/queue/RedisTokenConsumptionQueueConsumer.ts`
- [x] Class implementa `ITokenConsumptionQueueConsumer`
- [x] Constructor injeta:
  - `redis: Redis`
  - `repository: ITokenConsumptionRepository`
- [x] Método `start()`:
  - Inicia loop infinito (processamento assíncrono)
  - `redis.blpop('token_consumption:queue', 0)` (blocking pop)
  - Processa event, chama `repository.save(event)`
  - Success → retira da fila
  - Fail → enfileira em DLQ com retry count
  - Tratamento graceful (catch, logging, não crashes)
- [x] Método `stop()`: cancela loop de processamento
- [x] Retry logic:
  - Max 3 tentativas
  - Backoff exponencial (setTimeout)
  - Após falhat → move para `token_consumption:dlq`
- [x] Testes: `src/tokenConsumption/__tests__/infrastructure/RedisTokenConsumptionQueueConsumer.test.ts`
  - Mock de Redis e Repository
  - Teste de processamento nominal
  - Teste de retry e DLQ
  - Teste de graceful shutdown

**Detalhes:**

- Consumer roda em background (não bloqueia API)
- Usar `setInterval` ou while loop com await
- Logging: sucesso, retry, DLQ

---

## Fase 5: Application Layer

### T5.1 - Definir Interfaces (Portas) de Queue

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/application/service/ITokenConsumptionQueueProducer.ts`
  - Métodos: `enqueue(event): Promise<void>`
- [x] Arquivo `src/tokenConsumption/application/service/ITokenConsumptionQueueConsumer.ts`
  - Métodos: `start()`, `stop()`, `process(event)` (interno)

**Detalhes:**

- Interfaces preparadas para injeção

---

### T5.2 - Criar Use Case: Record Token Consumption

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/application/usecase/RecordTokenConsumptionUseCase.ts`
- [x] Class `RecordTokenConsumptionUseCase`
- [x] Constructor injeta `producer: ITokenConsumptionQueueProducer`
- [x] Método `execute(event: TokenConsumptionEvent): Promise<void>`
  - Valida event (delega para domain)
  - Chama `producer.enqueue(event)` (fire-and-forget)
  - Retorna void (não aguarda persistência)
  - Lança exception em erro
- [x] Testes: `src/tokenConsumption/__tests__/application/RecordTokenConsumptionUseCase.test.ts`
  - Mock de producer
  - Testes de sucesso/falha

**Detalhes:**

- Use case é orchestration pura (thin layer)
- Domínio / repositório resolvem lógica complexa

---

### T5.3 - Criar DI Container (Facade)

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/tokenConsumption.ts`
- [x] Exporta `tokenConsumptionContainer` object com:
  - `repository: ITokenConsumptionRepository`
  - `producer: ITokenConsumptionQueueProducer`
  - `consumer: ITokenConsumptionQueueConsumer`
  - `useCase: RecordTokenConsumptionUseCase`
- [x] Inicialização lazy ou eager (definir qual padrão)
- [x] Sem testes adicionais (é configuração)

**Detalhes:**

- Container simples (sem IoC container externo)
- Facilita injeção em routes

---

## Fase 6: Integração com Ad Generator Agent

### T6.1 - Integrar Use Case em API Route

**Acceptance Criteria:**

- [x] Arquivo `src/app/api/agent/generate/route.ts` modificado
- [x] Import `tokenConsumptionContainer`
- [x] Após geração bem-sucedida do anúncio:
  - Cria `TokenConsumptionEvent` com tokens do modelo
  - Chama `useCase.execute(event)` (fire-and-forget)
  - Não bloqueia resposta ao cliente
- [x] Erro de fila não interrompe resposta (logging apenas)
- [x] Testes: `src/app/api/agent/generate/__tests__/route.test.ts` modificado
  - Mock de `tokenConsumptionContainer`
  - Verifica que `useCase.execute` foi chamado

**Detalhes:**

- Event fire-and-forget (não espera persistência)
- Usar try-catch para logging de erro de fila (não crashes)

---

### T6.2 - Extrair Tokens do Modelo LLM

**Acceptance Criteria:**

- [x] Identificado como obter `inputTokens` e `outputTokens` do modelo
  - Opção 1: LangChain expõe `usage` em response
  - Opção 2: Contá tokens manualmente (TikToken lib)
- [x] Implementado getter de tokens em `AdGeneratorService` ou `AdStreamGenerator`
- [x] Tokens disponíveis na route handler (ao final de stream)

**Detalhes:**

- LangChain v0.1+ expõe `toLLMMessage()` com usage
- Verificar docs do `gpt-4o-mini` e `gemini-2.0-flash`

---

### T6.3 - Inicializar Consumer ao App Startup

**Acceptance Criteria:**

- [x] Consumer inicia ao startup da aplicação Next.js
- [x] Opção 1: Usar middleware/instrumentation.ts
- [x] Opção 2: Chamar manualmente em route handler (lazy init)
- [x] Consumer roda em background (não bloqueia routes)
- [x] Graceful shutdown: parar consumer ao desligar app

**Detalhes:**

- Se usar middleware, deve rodar apenas 1x (singleton check)
- Logging de startup/shutdown

---

## Fase 7: Testes e QA

> Nota: os itens abaixo em T7.3/T7.4 são de maturidade avançada e não bloqueiam o core já entregue.

### T7.1 - Testes Unitários Domínio

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/__tests__/domain/model/TokenConsumptionEvent.test.ts`
- [x] Cobertura:
  - Factory válida (happy path)
  - Factory com requestId inválido
  - Factory com tokens negativos
  - Factory com timestamp inválido
  - Equals method
  - ToString method
- [x] Mínimo 5 testes por classe
- [x] `pnpm test --testPathPattern=domain` passa

---

### T7.2 - Testes Unitários Infrastructure

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/__tests__/infrastructure/`
  - `DrizzleTokenConsumptionRepository.test.ts`
  - `RedisTokenConsumptionQueueProducer.test.ts`
  - `RedisTokenConsumptionQueueConsumer.test.ts`
- [x] Mocks:
  - Redis mocado (jest.mock ou redis-mock)
  - Drizzle mocado (jest.mock)
- [x] Cobertura nominal e error cases
- [x] `pnpm test --testPathPattern=infrastructure` passa

---

### T7.3 - Testes de Integração (E2E local)

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/__tests__/integration/token-consumption.integration.test.ts`
- [x] Setup:
  - PostgreSQL local (Docker)
  - Redis local (Docker)
- [x] Cenários:
  - Enfileirar event → verifica em fila
  - Consumer processa → verifica em DB
  - Retry em falha de DB
  - DLQ após 3 falhas
- [x] Teardown: limpa fila e DB
- [x] `pnpm test --testPathPattern=integration` passa

**Detalhes:**

- Pode usar `testcontainers` para PostgreSQL/Redis
- Ou usar Docker Compose local

---

### T7.4 - Teste de Performance (Benchmark)

**Acceptance Criteria:**

- [ ] Script `src/tokenConsumption/__tests__/benchmark/throughput.bench.ts`
- [ ] Testa:
  - Enqueue 1000 events: < 1s
  - Consumer processa 100+ events/s
  - Latência P99 < 100ms (enqueue to DB)
- [ ] Output readable (teste pode correr em CI)

**Detalhes:**

- Informativo (não bloqueia, mas registra)

---

## Fase 8: Documentação e Checklist Final

> Nota: esta fase consolida hardening/documentação. O core funcional da feature já está entregue.

### T8.1 - README e Documentação

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/README.md` com:
  - Visão geral da feature
  - Arquitetura (diagramas)
  - Como rodar migrations
  - Como rodar consumer
  - Exemplos de uso (chamar use case)
  - Troubleshooting (Redis down, DB down)
- [x] Variáveis de ambiente documentadas

---

### T8.2 - Definir Preparação para Extração em Microsserviço

**Acceptance Criteria:**

- [x] Documento `src/tokenConsumption/EXTRACTION_PLAN.md` com:
  - Quais classes migram para microsserviço
  - Quais interfaces ficam no monolito (contrato)
  - Exemplo de gRPC / GraphQL mutation para novo serviço
  - Estratégia de migração (big bang vs gradual)
- [x] Arquitetura garante:
  - Domain objects são agnósticas
  - Producer/Consumer podem ser trocados em runtime
  - Repository pode ser chamado via RPC

**Detalhes:**

- Não implementar microsserviço, apenas documentar

---

### T8.3 - Checklist Final

**Acceptance Criteria - TUDO abaixo deve estar ✅**

- [ ] `pnpm install` roda sem erro (deps adicionadas: drizzle-orm, ioredis)
- [x] `pnpm db:migrate` executa
- [x] `pnpm db:seed` executa
- [x] `pnpm test` passa (todas as suites)
- [x] `npx tsc --noEmit` sem erros
- [ ] `pnpm build` compila sem erro
- [ ] `pnpm lint` (se aplicável) sem erro
- [ ] Não há `any` type não justificado
- [ ] Código segue DDD/SOLID (revisão manual)
- [ ] README está atualizado
- [ ] Variáveis de ambiente está documentadas
- [ ] Migração para microsserviço está mapeada (não implementada)

---

## Ordem de Execução Recomendada

1. **Fase 1** (DB setup) - Prerequisito para tudo
2. **Fase 2** (Domain) - Define contrato
3. **Fase 3** (Infrastructure - DB) - Implementa persistência
4. **Fase 4** (Infrastructure - Queue) - Implementa fila
5. **Fase 5** (Application) - Orquestra
6. **Fase 6** (Integração com Agent) - Conecta tudo
7. **Fase 7** (Testes) - Valida
8. **Fase 8** (Docs) - Finaliza

---

## Responsabilidades de Revisão

- **Domain Layer**: Validação de value objects e exceções
- **Infrastructure**: Integridade de migrations e queries
- **Application**: Fluxo fire-and-forget sem bloqueio
- **Integration**: Funcionamento end-to-end
- **Documentation**: Clareza e extração para microsserviço
