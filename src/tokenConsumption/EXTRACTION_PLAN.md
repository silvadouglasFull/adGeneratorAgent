# Plano de Extração para Microsserviço

## Visão Geral

Este documento descreve como extrair o módulo `tokenConsumption` do monolito Next.js para um microsserviço independente, sem quebrar o contrato público existente.

## Classes que migram para o microsserviço

### Domain (copia integral)

- `domain/model/TokenConsumptionEvent.ts`
- `domain/model/TokenAggregation.ts`
- `domain/exception/TokenConsumptionException.ts`
- `domain/exception/TokenConsumptionRepositoryException.ts`
- `domain/exception/InvalidTokenConsumptionEventException.ts`
- `domain/exception/QueueConsumerException.ts`
- `domain/service/ITokenConsumptionRepository.ts`

### Infrastructure (copia integral)

- `infrastructure/persistence/DrizzleTokenConsumptionRepository.ts`
- `infrastructure/queue/RedisTokenConsumptionQueueConsumer.ts`
- `infrastructure/queue/redis-client.ts`
- `infrastructure/db/schema.ts`
- `infrastructure/db/client.ts`
- `infrastructure/db/migrations/` (todas)

### Application (copia parcial)

- `application/service/ITokenConsumptionQueueConsumer.ts`

## Classes que ficam no monolito

### Contrato (interfaces preservadas)

- `application/service/ITokenConsumptionQueueProducer.ts`
- `application/usecase/RecordTokenConsumptionUseCase.ts`

### Adaptação necessária

- `RedisTokenConsumptionQueueProducer` continua no monolito (enfileira no Redis compartilhado)
- Ou trocar por um `HttpTokenConsumptionProducer` que faz POST/gRPC no microsserviço

## Estratégia de migração: Gradual (Strangler Fig)

### Fase 1 — Microsserviço consumer (extração parcial)

1. Criar repositório separado com domain + infrastructure + consumer
2. Consumer novo consome a **mesma fila Redis** (`token_consumption:queue`)
3. Desligar consumer do monolito (`instrumentation.ts`)
4. Monolito continua enfileirando via `RedisTokenConsumptionQueueProducer`

**Risco**: zero — consumer é stateless, fila compartilhada

### Fase 2 — API no microsserviço

1. Expor endpoint no microsserviço:
   - `POST /api/token-consumption` (registrar evento)
   - `GET /api/token-consumption/model/:model` (total por modelo)
   - `GET /api/token-consumption/period` (agregação por período)
2. Trocar `RedisTokenConsumptionQueueProducer` por `HttpTokenConsumptionProducer`
3. Remover dependência de Redis para enfileiramento (opcional, micro processa direto)

### Fase 3 — Limpeza do monolito

1. Remover `infrastructure/queue/` e `infrastructure/persistence/` do monolito
2. Manter apenas `domain/` para tipagem e `application/` para contrato
3. Remover migrations Drizzle do monolito (vivem no microsserviço)

## Exemplo de API gRPC (alternativa)

```protobuf
service TokenConsumptionService {
  rpc RecordConsumption (TokenConsumptionRequest) returns (TokenConsumptionResponse);
  rpc GetTotalByModel (ModelRequest) returns (TokenTotalResponse);
  rpc GetTotalByPeriod (PeriodRequest) returns (TokenAggregationResponse);
}

message TokenConsumptionRequest {
  string request_id = 1;
  string model_used = 2;
  int32 input_tokens = 3;
  int32 output_tokens = 4;
  string timestamp = 5;
}
```

## Garantias de compatibilidade

- Domain objects são agnósticos a framework (sem dependências Next.js)
- Producer/Consumer podem ser trocados em runtime via injeção de dependência
- Repository é acessado apenas via interface `ITokenConsumptionRepository`
- Fila Redis pode ser substituída por Kafka/RabbitMQ sem alterar domain
