# Spec: Registro Imutável de Custos via Helicone (Multi-Modelo)

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`
Spec dependente: `openspec/specs/token-consumption-tracking.md`
Spec dependente: `openspec/specs/agent-model-routing.md`

---

## Visão Geral

Integrar o Helicone como gateway de proxy para OpenAI e Google Gemini, capturar o custo exato em USD retornado pelo Helicone no momento da geração e persistir esse valor imutavelmente no banco de dados PostgreSQL, garantindo que o histórico financeiro nunca seja afetado por variações futuras na tabela de preços dos provedores. Deve ser um serviço independente dos serviços já existestes.

## Problema

A implementação atual de `TokenConsumptionTracking` registra tokens consumidos (`inputTokens`, `outputTokens`) mas **não registra custo financeiro**. Ademais:

1. Calcular custo a posteriori a partir de tokens é frágil: se a tabela de preços mudar, o histório financeiro muda retroativamente.
2. Modelos diferentes têm preços diferentes; o custo calculado localmente exige manter uma tabela de preços sincronizada manualmente.
3. Não há suporte a conversão de moeda no momento da execução.

## Objetivo

1. **Usar Helicone como proxy** para OpenAI e Google Gemini — o Helicone calcula custo automaticamente por modelo.
2. **Capturar o custo no momento exato da execução** e persisti-lo como snapshot imutável.
3. **Adicionar campos de custo** ao schema existente sem quebrar o contrato atual.
4. **Registrar taxa de câmbio USD→BRL no momento** da execução para preservar rastreabilidade financeira.
5. **Expor endpoint** para consulta de custo total do usuário.

## Escopo

### Dentro do escopo

- Configuração do Helicone como proxy (OpenAI e Google Gemini)
- Factory de modelos `ModelProviderFactory` com headers Helicone
- Migração Drizzle para adicionar campos `costUSD`, `costBRL`, `exchangeRateAtExecution`, `heliconeRequestId` à tabela `token_consumptions`
- Serviço `CostCapturePipeline` (application): orquestra geração + captura de custo
- Serviço de domínio `CostRecord` (value object imutável)
- Adaptador `HeliconeCostAdapter` (infrastructure): consulta custo via Helicone API
- Serviço `ExchangeRateAdapter` (infrastructure): obtém taxa USD→BRL
- Endpoint `GET /api/costs/summary` para sumário de custo do usuário
- Testes unitários e de integração

### Fora do escopo

- Dashboard visual de custos (apenas endpoint de dados)
- Alertas por limite de gasto
- Suporte a outros provedores além de OpenAI e Google Gemini
- Retroactive backfill de custo em registros antigos sem `costUSD`

---

## Contrato de Domínio

### Value Object: `CostRecord`

```typescript
// src/tokenConsumption/domain/model/CostRecord.ts

type CostRecord = {
  readonly costUSD: number; // custo em dólar no momento da execução (snapshot)
  readonly costBRL: number; // custo em real no momento da execução (snapshot)
  readonly exchangeRateAtExecution: number; // taxa USD→BRL usada
  readonly heliconeRequestId: string | null; // ID do request no Helicone (para auditoria)
};
```

Regras:

- `costUSD` e `costBRL` nunca são recalculados após persistência.
- `costUSD >= 0` (nunca negativo).
- `costBRL = costUSD * exchangeRateAtExecution`, arredondado a 6 casas decimais.
- Se Helicone não retornar custo (falha de rede/parsing), registrar `costUSD = 0` com `heliconeRequestId = null`.

---

### Interface: `IHeliconeCostAdapter`

```typescript
// src/tokenConsumption/domain/service/IHeliconeCostAdapter.ts

interface IHeliconeCostAdapter {
  // Busca o custo em USD de um request Helicone pelo seu ID
  getCostByRequestId(heliconeRequestId: string): Promise<number>;
}
```

---

### Interface: `IExchangeRateAdapter`

```typescript
// src/tokenConsumption/domain/service/IExchangeRateAdapter.ts

interface IExchangeRateAdapter {
  // Retorna a taxa atual de câmbio USD → BRL
  getUSDtoBRL(): Promise<number>;
}
```

---

## Arquitetura

### Camadas e Responsabilidades

```text
src/tokenConsumption/
  domain/
    model/
      CostRecord.ts                   ← value object imutável
    service/
      IHeliconeCostAdapter.ts         ← porta de custo
      IExchangeRateAdapter.ts         ← porta de câmbio
      ICostCaptureService.ts          ← porta de orquestração
  application/
    service/
      CostCaptureService.ts           ← orquestra captura e persistência de custo
  infrastructure/
    providers/
      HeliconeCostAdapter.ts          ← chama API do Helicone
      ExchangeRateAdapter.ts          ← chama API de câmbio (ex: AwesomeAPI)
    db/
      schema.ts                       ← MIGRATION: adiciona campos de custo

src/agent/
  infrastructure/
    providers/
      ModelProviderFactory.ts         ← instancia modelos com proxy Helicone
```

---

### Fluxo de Execução

```
POST /api/agent/generate
         │
         ▼
  AdStreamGenerator
         │
         ▼
  ModelProviderFactory.create(model, userId)
  → ChatOpenAI configurado com baseURL Helicone
  → ChatGoogleGenerativeAI configurado com baseURL Helicone
         │
         ▼
  LangGraph executa geração (stream)
         │
         ▼
  Metadados retornados:
    - usage_metadata (tokens)
    - response_metadata.headers["helicone-id"]
         │
         ▼ (fire-and-forget, não bloqueia stream)
  TokenConsumptionQueueProducer.enqueue({
    requestId, modelUsed, inputTokens, outputTokens,
    heliconeRequestId  ← NOVO
  })
         │
         ▼ (consumer assíncrono)
  TokenConsumptionQueueConsumer.process()
         │
         ▼
  HeliconeCostAdapter.getCostByRequestId(heliconeRequestId)
  → GET https://api.hconeai.com/v1/request/{id}
  → extrai campo cost_usd
         │
         ▼
  ExchangeRateAdapter.getUSDtoBRL()
  → GET https://economia.awesomeapi.com.br/json/last/USD-BRL
  → extrai campo ask
         │
         ▼
  CostRecord criado e validado no domínio
         │
         ▼
  TokenConsumptionRepository.save({ ...evento, ...costRecord })
  → coluna cost_usd, cost_brl, exchange_rate_at_execution, helicone_request_id
         │
         ▼
  Dado persistido imutavelmente no PostgreSQL
```

---

## Configuração do Gateway Helicone

### Variáveis de Ambiente

```env
HELICONE_API_KEY=sk-helicone-...
```

### URLs de Proxy por Provedor

| Provedor | URL original da OpenAI/Google             | URL via proxy Helicone      |
| -------- | ----------------------------------------- | --------------------------- |
| OpenAI   | https://api.openai.com                    | https://oai.hconeai.com     |
| Gemini   | https://generativelanguage.googleapis.com | https://gateway.hconeai.com |

### Headers Obrigatórios

| Header             | Valor                        |
| ------------------ | ---------------------------- |
| `Helicone-Auth`    | `Bearer ${HELICONE_API_KEY}` |
| `Helicone-User-Id` | userId do contexto atual     |

---

## Migração do Schema (Drizzle)

### Campos adicionados à tabela `token_consumptions`

| Campo                        | Tipo             | Nullable | Default | Descrição                 |
| ---------------------------- | ---------------- | -------- | ------- | ------------------------- |
| `helicone_request_id`        | `varchar(100)`   | sim      | null    | ID do request no Helicone |
| `cost_usd`                   | `numeric(12, 8)` | não      | 0       | Custo em USD no momento   |
| `cost_brl`                   | `numeric(12, 8)` | não      | 0       | Custo em BRL no momento   |
| `exchange_rate_at_execution` | `numeric(10, 6)` | não      | 0       | Taxa USD→BRL utilizada    |

> Campos `cost_usd`, `cost_brl` e `exchange_rate_at_execution` default 0 para manter compatibilidade com registros existentes sem retroactive update.

---

## API: `GET /api/costs/summary`

### Request

```http
GET /api/costs/summary?userId=<uuid>
```

### Response

```json
{
  "totalCostUSD": 0.04321,
  "totalCostBRL": 0.230012,
  "requestCount": 42,
  "byModel": {
    "gpt-4o-mini": { "totalCostUSD": 0.03, "requestCount": 30 },
    "gemini-2.0-flash": { "totalCostUSD": 0.01321, "requestCount": 12 }
  },
  "period": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-03-17T23:59:59Z"
  }
}
```

### Regras

- Soma `SUM(cost_usd)` e `SUM(cost_brl)` diretamente do banco (dados imutáveis).
- Não recalcula custo a partir de tokens.
- Agrupa por `model_used`.
- `userId` é obrigatório; retorna 400 se ausente.

---

## ModelProviderFactory

### Responsabilidades

- Instanciar `ChatOpenAI` com `baseURL` apontando para Helicone (`https://oai.hconeai.com`).
- Instanciar `ChatGoogleGenerativeAI` com `baseUrl` apontando para Helicone (`https://gateway.hconeai.com`).
- Injetar headers `Helicone-Auth` e `Helicone-User-Id`.
- Manter compatibilidade com o `AdGeneratorGraphBuilder` atual (aceitar `SupportedModel`).

### Interface

```typescript
// src/agent/domain/service/IModelProviderFactory.ts

interface IModelProviderFactory {
  create(model: SupportedModel, userId: string): BaseChatModel;
}
```

---

## Critérios de Aceitação

- [ ] `HELICONE_API_KEY` configurada e validada em startup
- [ ] `ModelProviderFactory` instancia modelos com proxy Helicone para OpenAI e Gemini
- [ ] Header `helicone-id` extraído do response e enfileirado junto com o evento de token
- [ ] Migração Drizzle adiciona `cost_usd`, `cost_brl`, `exchange_rate_at_execution`, `helicone_request_id` sem quebrar schema existente
- [ ] `HeliconeCostAdapter` busca custo real via API do Helicone (`GET /v1/request/{id}`)
- [ ] `ExchangeRateAdapter` busca taxa USD→BRL de fonte externa no momento da execução
- [ ] `CostRecord` value object valida: `costUSD >= 0`, `costBRL = costUSD * exchangeRate`
- [ ] `TokenConsumptionRepository.save()` persiste os campos de custo junto ao evento
- [ ] Custo salvo nunca é recalculado por serviço externo (somente leitura após persistência)
- [ ] `GET /api/costs/summary` retorna soma de custos agrupados por modelo
- [ ] Testes unitários cobrem `CostRecord`, `CostCaptureService`, `HeliconeCostAdapter`, `ExchangeRateAdapter`
- [ ] Testes de integração cobrem o pipeline completo (fila → captura → persistência)
- [ ] `pnpm test` passa sem erros
- [ ] `npx tsc --noEmit` sem erros

---

## Requisitos de Qualidade (padrão DDD + SOLID)

- `CostRecord` é value object imutável (readonly em todos os campos).
- `HeliconeCostAdapter` e `ExchangeRateAdapter` dependem de interface (`IHeliconeCostAdapter`, `IExchangeRateAdapter`) — inversão de dependência.
- `CostCaptureService` (application) não importa diretamente adaptadores de infraestrutura; recebe por injeção de dependência.
- Erros de rede no Helicone ou na API de câmbio não devem quebrar o fluxo de geração de anúncio (degradação parcial: `costUSD = 0`).
- Não duplicar lógica já presente em `TokenConsumptionTracking` — estender, não substituir.

---

## Dependências Externas

| Serviço                 | Finalidade                   | URL                                                  |
| ----------------------- | ---------------------------- | ---------------------------------------------------- |
| Helicone                | Proxy + cálculo de custo     | https://api.hconeai.com                              |
| Helicone (OpenAI proxy) | Redirecionamento para OpenAI | https://oai.hconeai.com                              |
| Helicone (Gemini proxy) | Redirecionamento para Gemini | https://gateway.hconeai.com                          |
| AwesomeAPI (câmbio)     | Taxa USD→BRL em tempo real   | https://economia.awesomeapi.com.br/json/last/USD-BRL |

---

## Referências

- Spec anterior: `openspec/specs/token-consumption-tracking.md`
- Padrões de código: `openspec/specs/ai-code-generation-standards.md`
- Roteamento de modelos: `openspec/specs/agent-model-routing.md`
