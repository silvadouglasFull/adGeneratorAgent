# Spec: Token Consumption Tracking Service

Fase anterior: `openspec/specs/ad-generator-agent.md`

---

## Visão Geral

Implementar um serviço de rastreamento de consumo de tokens do agente gerador de anúncios com arquitetura preparada para extração futura em microsserviço. O serviço deve persistir em banco PostgreSQL via Drizzle ORM e processar eventos de forma assíncrona através de fila Redis, sem bloquear a geração de anúncios.

## Objetivo

1. **Registrar consumo de tokens** durante a geração de anúncios (input + output)
2. **Não bloquear fluxo principal** via fila assíncrona
3. **Preparar extração para microsserviço** isolando lógica de persistência
4. **Suportar crescimento rápido** com arquitetura escalável

## Escopo

### Dentro do escopo

- Criação de tabelas PostgreSQL (migrations + seeds com Drizzle)
- Service de persistência (`TokenConsumptionRepository`)
- Producer: Enfileirar eventos após geração bem-sucedida
- Consumer: Processar fila e persistir no banco
- Integração com `AdGeneratorAgent` (injetar dependências)
- Testes unitários do domínio e aplicação
- Testes de integração (fila + banco)

### Fora do escopo

- Microsserviço externo (apenas preparação arquitetural)
- Dashboard de visualização de tokens
- Alertas/notificações por limite

## Critérios de Aceitação

- [ ] Schema PostgreSQL definido (migrations Drizzle)
- [ ] Seeds iniciais criadas
- [ ] `TokenConsumptionRepository` implementado (DDD + SOLID)
- [ ] Fila Redis configurada para eventos de consumo
- [ ] Producer enfileira eventos após `AdGeneratorAgent.streamGeneratedAd()` sucesso
- [ ] Consumer consome fila e persiste dados
- [ ] Regra de negócio: registrar `{modelUsed, inputTokens, outputTokens, requestId, timestamp, status}`
- [ ] Testes cobrem nominal e error cases (falha de fila, retry)
- [ ] `pnpm test` passa
- [ ] `npx tsc --noEmit` sem erros
- [ ] Possibilidade clara de extração para microsserviço (sem refatoração quebrada de contrato público)

## Contrato de Domínio

### Value Object: `TokenConsumptionEvent`

```typescript
{
  requestId: string          // UUID único por requisição
  modelUsed: SupportedModel  // gpt-4o-mini, gemini-2.0-flash
  inputTokens: number        // tokens da entrada
  outputTokens: number       // tokens da saída gerada
  totalTokens: number        // inputTokens + outputTokens
  timestamp: Date            // ISO 8601
  status: 'success' | 'failed' // resultado da persistência
  errorMessage?: string      // se status === 'failed'
}
```

### Service: `TokenConsumptionRepository`

**Responsabilidades (DDD - Persistence)**

```typescript
interface ITokenConsumptionRepository {
  // Persistir evento de consumo (idempotente via requestId)
  save(event: TokenConsumptionEvent): Promise<void>;

  // Recuperar total de tokens consumidos por modelo
  getTotalTokensByModel(model: SupportedModel): Promise<number>;

  // Recuperar total consumido no período
  getTotalTokensByPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<TokenAggregation>;

  // Recuperar eventos (para auditoria/retry)
  getByRequestId(requestId: string): Promise<TokenConsumptionEvent | null>;

  // Listar eventos falhados para retry
  getFailedEvents(limit: number): Promise<TokenConsumptionEvent[]>;
}

type TokenAggregation = {
  period: { start: Date; end: Date };
  totalTokens: number;
  byModel: Record<SupportedModel, number>;
  requestCount: number;
};
```

### Service: `TokenConsumptionQueueProducer`

**Responsabilidades (Application - Orchestration)**

```typescript
interface ITokenConsumptionQueueProducer {
  // Enfileirar evento (fire-and-forget, não bloqueia)
  enqueue(event: TokenConsumptionEvent): Promise<void>;
}
```

### Service: `TokenConsumptionQueueConsumer`

**Responsabilidades (Infrastructure - Async Processing)**

```typescript
interface ITokenConsumptionQueueConsumer {
  // Iniciar consumer (chamado na startup)
  start(): Promise<void>;

  // Parar consumer (chamado no shutdown)
  stop(): Promise<void>;

  // Processar um evento (implementação interna)
  process(event: TokenConsumptionEvent): Promise<void>;
}
```

## Arquitetura

### Fluxo sem Bloqueio

```
┌─────────────────────────────┐
│  adGeneratorAgent.ts        │
│  (gera anúncio via stream)  │
└──────────────┬──────────────┘
               │
               ▼
        ┌──────────────┐
        │ evento       │
        │ TokenConsumed│
        └──────────────┘
               │
               ▼ (fire-and-forget)
        ┌──────────────────┐
        │  Redis Queue     │
        │  (fila de eventos)│
        └──────────────────┘
               │
               │ (consumer async)
               ▼
        ┌──────────────────┐
        │ TokenConsumption │
        │ QueueConsumer    │
        └──────────────────┘
               │
               ▼
        ┌──────────────────┐
        │  PostgreSQL      │
        │  token_consumptions│
        └──────────────────┘
```

### Estrutura de Pastas

```
src/
├── tokenConsumption/
│   ├── domain/
│   │   ├── model/
│   │   │   ├── TokenConsumptionEvent.ts      # Value Object
│   │   │   └── TokenAggregation.ts           # VO para agregação
│   │   │
│   │   ├── service/
│   │   │   └── ITokenConsumptionRepository.ts # Interface (porta)
│   │   │
│   │   └── exception/
│   │       ├── TokenConsumptionException.ts
│   │       └── QueueConsumerException.ts
│   │
│   ├── application/
│   │   ├── service/
│   │   │   ├── ITokenConsumptionQueueProducer.ts # Interface (porta)
│   │   │   └── ITokenConsumptionQueueConsumer.ts # Interface (porta)
│   │   │
│   │   └── usecase/
│   │       └── RecordTokenConsumptionUseCase.ts # Coordena enfileiramento
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── DrizzleTokenConsumptionRepository.ts
│   │   │   └── schema.ts                     # Drizzle schema
│   │   │
│   │   ├── queue/
│   │   │   ├── RedisTokenConsumptionQueueProducer.ts
│   │   │   └── RedisTokenConsumptionQueueConsumer.ts
│   │   │
│   │   └── db/
│   │       ├── migrations/                  # Auto-geradas por Drizzle
│   │       └── seeds/
│   │           └── token_consumption.seed.ts
│   │
│   └── tokenConsumption.ts                  # Facade / Container
│
├── agent/
│   ├── ...
│   └── adGeneratorAgent.ts                  # Injeta dependencies
│
└── app/
    └── api/
        └── agent/
            └── generate/
                └── route.ts                 # Integra recordTokenConsumption
```

### Injeção de Dependências

**Inicialização (Singleton - startup)**

```typescript
// src/tokenConsumption/tokenConsumption.ts
export const tokenConsumptionContainer = {
  repository: new DrizzleTokenConsumptionRepository(db),
  producer: new RedisTokenConsumptionQueueProducer(redis),
  consumer: new RedisTokenConsumptionQueueConsumer(redis, repository),
  useCase: new RecordTokenConsumptionUseCase(producer),
};
```

**Integração na route**

```typescript
// src/app/api/agent/generate/route.ts
import { tokenConsumptionContainer } from "@/tokenConsumption/tokenConsumption";

// No handler:
const { useCase } = tokenConsumptionContainer;
// Antes de retornar a stream
useCase.execute(tokenConsumptionEvent); // fire-and-forget
```

## Arquitetura de Fila (Preparada para Extração)

### Redis Queue Schema

```typescript
// Fila: token_consumption:queue
// Cada item é um JSON stringificado TokenConsumptionEvent
{
  "requestId": "uuid-1234",
  "modelUsed": "gpt-4o-mini",
  "inputTokens": 150,
  "outputTokens": 320,
  "totalTokens": 470,
  "timestamp": "2026-03-16T10:00:00Z",
  "status": "success"
}
```

### Dead Letter Queue (DLQ)

```
token_consumption:dlq  // eventos que falharam > 3 retentativas
token_consumption:processed  // eventos processados com sucesso (cache por 24h)
```

### Retry Strategy

- **Max retries**: 3
- **Backoff**: exponencial (1s → 2s → 4s)
- **DLQ**: eventos não processáveis após max retries

## Tech Stack

- **ORM**: Drizzle (TypeScript-first)
- **Database**: PostgreSQL (UTC timezone)
- **Queue**: Redis (ioredis)
- **DDD**: Value Objects, Repositories, Services
- **Testing**: Jest com mocks de Redis/PostgreSQL

## Definição de Pronto (DoD)

Uma entrega só é considerada pronta quando:

1. Compila sem erros TypeScript
2. Migrations Drizzle rodam sem erro
3. Testes passam (cobertura > 80% do domínio + application)
4. Consumer processa 100+ eventos/segundo (benchmark)
5. Sem bloqueio na geração de anúncios (assíncrono verificado)
6. Código respeita DDD/SOLID (dependências invertidas)
7. Possibilidade clara de extrair para microsserviço sem quebrar contrato público

## Próximos Passos (Fora do escopo)

- Migrar consumer para microsserviço (GraphQL mutations, REST ou gRPC)
- Dashboard de visualização de tokens
- Webhooks para alertas de limite
