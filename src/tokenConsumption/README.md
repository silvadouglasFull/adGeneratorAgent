# Token Consumption Tracking

Serviço de rastreamento de consumo de tokens do agente gerador de anúncios, com persistência em PostgreSQL (Drizzle ORM) e processamento assíncrono via fila Redis.

## Arquitetura

```
POST /api/agent/generate
        │
        ▼ (fire-and-forget)
  RecordTokenConsumptionUseCase
        │
        ▼
  RedisTokenConsumptionQueueProducer  →  Redis (token_consumption:queue)
                                              │
                                              ▼ (consumer background)
                                    RedisTokenConsumptionQueueConsumer
                                              │
                                              ▼
                                    DrizzleTokenConsumptionRepository → PostgreSQL
```

### Camadas

| Camada         | Responsabilidade                      | Pasta                                                                        |
| -------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| Domain         | Value objects, exceções, interfaces   | `domain/model/`, `domain/service/`, `domain/exception/`                      |
| Application    | Use case, interfaces de fila          | `application/usecase/`, `application/service/`                               |
| Infrastructure | Drizzle repo, Redis producer/consumer | `infrastructure/persistence/`, `infrastructure/queue/`, `infrastructure/db/` |

## Variáveis de Ambiente

| Variável         | Descrição                       | Default                                                      |
| ---------------- | ------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`   | Connection string do PostgreSQL | `postgresql://postgres:postgres@localhost:5432/ad_generator` |
| `REDIS_URL`      | URL de conexão com Redis        | `redis://localhost:6379`                                     |
| `REDIS_USERNAME` | Usuário Redis (ACL)             | `redis_app`                                                  |
| `REDIS_PASSWORD` | Senha Redis                     | `redis_password`                                             |

## Setup

### 1. Subir infraestrutura

```bash
docker compose up -d
```

### 2. Rodar migrations

```bash
pnpm db:migrate
```

### 3. Seed (dados de exemplo)

```bash
pnpm db:seed
```

### 4. Gerar novas migrations (após alterar schema)

```bash
npx drizzle-kit generate
```

## Consumer

O consumer é iniciado automaticamente via `src/instrumentation.ts` quando a aplicação Next.js sobe no runtime Node.js.

- **Startup**: `ensureTokenConsumptionConsumerStarted()` é chamado no `register()` do instrumentation
- **Shutdown**: graceful stop via `SIGTERM`/`SIGINT`
- **Fallback**: lazy init no route handler caso o instrumentation não execute

### Retry e DLQ

- Max retries: **3**
- Backoff: exponencial (1s → 2s → 4s)
- Fila DLQ: `token_consumption:dlq`
- Eventos não processáveis após 3 tentativas são movidos para a DLQ

## Uso programático

```typescript
import { tokenConsumptionContainer } from "@/tokenConsumption/tokenConsumption";
import { TokenConsumptionEvent } from "@/tokenConsumption/domain/model/TokenConsumptionEvent";

const event = TokenConsumptionEvent.create({
  requestId: crypto.randomUUID(),
  modelUsed: "gpt-4o-mini",
  inputTokens: 150,
  outputTokens: 320,
  timestamp: new Date(),
});

// Fire-and-forget
tokenConsumptionContainer.useCase.execute(event);
```

## Troubleshooting

| Problema                  | Solução                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Redis connection refused  | Verificar `docker compose up -d` e variáveis `REDIS_*`                                  |
| Database connection error | Verificar `DATABASE_URL` e container PostgreSQL                                         |
| Consumer não processa     | Verificar logs de startup; chamar `ensureTokenConsumptionConsumerStarted()` manualmente |
| Eventos na DLQ            | Verificar `redis-cli LRANGE token_consumption:dlq 0 -1`                                 |
| Migration falha           | Verificar `DATABASE_URL` e que PostgreSQL está rodando                                  |

## Testes

```bash
# Todos os testes
pnpm test

# Apenas testes de token consumption
pnpm test --testPathPattern=tokenConsumption

# Testes de integração
pnpm test --testPathPattern=integration
```
