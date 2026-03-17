# Tasks: Registro Imutável de Custos via Helicone (Multi-Modelo)

**Spec**: `openspec/specs/helicone-immutable-cost-tracking.md`
**Dependências implementadas**: Token Consumption Tracking (Fases 1–6), Agent Model Routing

---

## Fase 1 — Configuração do Gateway Helicone

### T1.1 — Adicionar variável de ambiente `HELICONE_API_KEY`

**Acceptance Criteria:**

- [x] `HELICONE_API_KEY` adicionada ao `.env.local`
- [x] Variável adicionada ao `docker-compose.yml` (serviço `app`)
- [x] Startup da aplicação valida existência de `HELICONE_API_KEY` (log de aviso, sem crash)
- [x] `.env.local.example` atualizado (sem valor real)

**Detalhes:**

- Não lançar erro fatal se ausente — degradar para `costUSD = 0` (Helicone indisponível)
- Adicionar ao mesmo bloco de variáveis de AI do `.env.local`

---

### T1.2 — Criar `ModelProviderFactory` com proxy Helicone

**Acceptance Criteria:**

- [x] Arquivo `src/agent/infrastructure/providers/ModelProviderFactory.ts` criado
- [x] Implementa interface `IModelProviderFactory` (domain)
- [x] Para `gpt-4o-mini` / OpenAI: `configuration.baseURL = https://oai.helicone.ai/v1`
- [x] Para `gemini-2.0-flash` / Gemini: `baseUrl = https://gateway.helicone.ai` + `customHeaders` com `Helicone-Target-URL` (suportado pelo LangChain)
- [x] Header `Helicone-Auth: Bearer ${HELICONE_API_KEY}` presente em OpenAI via `configuration.defaultHeaders`
- [x] Header `Helicone-User-Id: ${userId}` presente em OpenAI via `configuration.defaultHeaders`
- [x] `AdGeneratorGraphBuilder` — `ModelProviderFactory` criado (integração com grafo pendente)
- [x] TypeScript compila sem erros

**Detalhes:**

```typescript
// Contrato
interface IModelProviderFactory {
  create(model: SupportedModel, userId: string): BaseChatModel;
}

// Implementação
class ModelProviderFactory implements IModelProviderFactory {
  create(model: SupportedModel, userId: string): BaseChatModel { ... }
}
```

- Injetar na construção do `AdGeneratorGraphBuilder` (ou no grafo LangGraph)
- Não alterar a API pública de `streamGeneratedAd()` — apenas a instanciação interna do modelo

---

## Fase 2 — Migração do Schema (Drizzle)

### T2.1 — Adicionar campos de custo ao schema Drizzle

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/db/schema.ts` atualizado com:
  - `heliconeRequestId`: `varchar(100)` nullable
  - `costUSD`: `numeric(12, 8)` não-nulo, default `0`
  - `costBRL`: `numeric(12, 8)` não-nulo, default `0`
  - `exchangeRateAtExecution`: `numeric(10, 6)` não-nulo, default `0`
- [x] Tipos `TokenConsumption` e `NewTokenConsumption` atualizados automaticamente pelo Drizzle
- [x] TypeScript compila sem erros (`npx tsc --noEmit`)

---

### T2.2 — Gerar e executar migration

**Acceptance Criteria:**

- [x] `pnpm drizzle-kit generate` cria migration para os 4 novos campos
- [x] Migration SQL inclui `DEFAULT 0` para campos de custo (não-breaking para dados existentes)
- [x] `pnpm drizzle-kit push` executa sem erros
- [x] Tabela `token_consumptions` contém os novos campos no banco
- [x] Registros existentes têm `cost_usd = 0`, `cost_brl = 0` (default preservado)

---

## Fase 3 — Domain: Value Object e Interfaces

### T3.1 — Criar value object `CostRecord`

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/domain/model/CostRecord.ts` criado
- [x] Todos os campos são `readonly`
- [x] Método estático `CostRecord.create()` valida:
  - `costUSD >= 0`
  - `costBRL` calculado como `costUSD * exchangeRateAtExecution` (6 casas decimais)
  - Se inválido, lança `CostRecordValidationException`
- [x] Método estático `CostRecord.zero()` retorna record de custo zerado (fallback)

---

### T3.2 — Criar exceção de domínio `CostRecordValidationException`

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/domain/exception/CostRecordValidationException.ts` criado
- [x] Estende `Error` com nome e mensagem descritivos
- [x] Usada exclusivamente no `CostRecord.create()`

---

### T3.3 — Criar interfaces de porta `IHeliconeCostAdapter` e `IExchangeRateAdapter`

**Acceptance Criteria:**

- [x] `src/tokenConsumption/domain/service/IHeliconeCostAdapter.ts` criado
- [x] `src/tokenConsumption/domain/service/IExchangeRateAdapter.ts` criado
- [x] Interfaces tipadas conforme contrato da spec

---

## Fase 4 — Infrastructure: Adaptadores Externos

### T4.1 — Criar `HeliconeCostAdapter`

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/providers/HeliconeCostAdapter.ts` criado
- [x] Implementa `IHeliconeCostAdapter`
- [x] Chama `GET https://api.helicone.ai/v1/request/{heliconeRequestId}`
- [x] Autentica com header `Authorization: Bearer ${HELICONE_API_KEY}`
- [x] Extrai `cost_usd` do payload de resposta
- [x] Em erro de rede ou parsing, retorna `0` (não propaga exceção)
- [x] Log de aviso em caso de falha (sem crash)

**Payload esperado do Helicone:**

```json
{
  "data": {
    "cost_usd": 0.000042
  }
}
```

---

### T4.2 — Criar `ExchangeRateAdapter`

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/providers/ExchangeRateAdapter.ts` criado
- [x] Implementa `IExchangeRateAdapter`
- [x] Chama `GET https://economia.awesomeapi.com.br/json/last/USD-BRL`
- [x] Extrai campo `ask` do payload (`USDBRL.ask`)
- [x] Converte string para `number` (parseFloat)
- [x] Em erro de rede ou parsing, retorna fallback fixo `6.0` (não propaga exceção)
- [x] Log de aviso em caso de fallback

**Payload esperado:**

```json
{
  "USDBRL": {
    "ask": "5.8900"
  }
}
```

---

## Fase 5 — Application: Serviço de Captura de Custo

### T5.1 — Criar `CostCaptureService`

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/application/service/CostCaptureService.ts` criado
- [x] Implementa interface `ICostCaptureService` (domain)
- [x] Recebe `IHeliconeCostAdapter` e `IExchangeRateAdapter` por injeção de dependência
- [x] Método `capture(heliconeRequestId: string): Promise<CostRecord>`:
  - Chama `heliconeCostAdapter.getCostByRequestId(heliconeRequestId)`
  - Chama `exchangeRateAdapter.getUSDtoBRL()`
  - Cria e retorna `CostRecord` via `CostRecord.create()`
  - Em qualquer falha, retorna `CostRecord.zero()`

---

### T5.2 — Atualizar `TokenConsumptionEvent` para incluir `heliconeRequestId`

**Acceptance Criteria:**

- [x] Value object `TokenConsumptionEvent` (domain) recebe campo opcional `heliconeRequestId?: string`
- [x] `TokenConsumptionQueueProducer.enqueue()` aceita e repassa `heliconeRequestId`
- [x] Queue consumer lê `heliconeRequestId` do evento e passa ao `CostCaptureService`
- [x] Compatibilidade retroativa: campo opcional não quebra eventos sem `heliconeRequestId`

---

### T5.3 — Atualizar `TokenConsumptionQueueConsumer` para capturar e persistir custo

**Acceptance Criteria:**

- [x] Consumer chama `CostCaptureService.capture(heliconeRequestId)` após receber evento
- [x] `TokenConsumptionRepository.save()` recebe `CostRecord` junto ao evento
- [x] `costUSD`, `costBRL`, `exchangeRateAtExecution`, `heliconeRequestId` persistidos na tabela
- [x] Falha no `CostCaptureService` não impede persistência do evento (salva com custo zerado)

---

## Fase 6 — Infrastructure: Captura do `helicone-id` no Agente

### T6.1 — Extrair `helicone-id` do response do LangChain

**Acceptance Criteria:**

- [x] `AdStreamGenerator` (ou nó do LangGraph) captura o header/metadata `helicone-id` do response
- [x] `heliconeRequestId` extraído de `response_metadata?.headers?.["helicone-id"]` (OpenAI) ou equivalente (Gemini)
- [x] `heliconeRequestId` adicionado ao evento enfileirado no `TokenConsumptionQueueProducer`
- [x] Se não encontrado, enfileira com `heliconeRequestId = null`

**Detalhes de lookup no LangChain:**

```typescript
// OpenAI via LangChain
const heliconeId =
  result.response_metadata?.headers?.["helicone-id"] ??
  result.additional_kwargs?.rawResponse?.headers?.["helicone-id"] ??
  null;
```

---

## Fase 7 — API: Endpoint de Sumário de Custos

### T7.1 — Criar `GET /api/costs/summary`

**Acceptance Criteria:**

- [x] Arquivo `src/app/api/costs/summary/route.ts` criado
- [x] Método `GET` com query param opcional `userId` (retorna sumário global se ausente)
- [x] Retorna 400 se `userId` fornecido mas inválido (não UUID)
- [x] Retorna 200 com payload:
  ```json
  {
    "totalCostUSD": number,
    "totalCostBRL": number,
    "requestCount": number,
    "byModel": {
      "<model>": { "totalCostUSD": number, "requestCount": number }
    },
    "period": { "start": string, "end": string }
  }
  ```
- [x] Soma `cost_usd` e `cost_brl` diretamente do banco via `SUM()` (não recalcula)
- [x] Agrupa por `model_used`
- [x] `period` retorna o intervalo entre o primeiro e último registro do usuário

### T7.2 — Criar `CostSummaryRepository`

**Acceptance Criteria:**

- [x] Arquivo `src/tokenConsumption/infrastructure/persistence/CostSummaryRepository.ts` criado
- [x] Método `getSummary(userId?: string): Promise<CostSummary>`:
  - Query com `SUM(cost_usd)`, `SUM(cost_brl)`, `COUNT(*)`
  - GROUP BY `model_used`
  - Filtro por `userId` quando fornecido (opcional)
- [x] Retorna objeto `CostSummary` tipado

### T7.3 — Adicionar campo `userId` à tabela `token_consumptions`

**Acceptance Criteria:**

- [x] Campo `userId` (`varchar(100)` nullable) adicionado ao schema Drizzle
- [x] Migration gerada e executada
- [x] `TokenConsumptionEvent` e producer/consumer atualizado para incluir `userId`
- [x] Índice simples em `userId` para queries de sumário

---

## Fase 8 — Testes

### T8.1 — Testes unitários de domínio

**Acceptance Criteria:**

- [x] `CostRecord.create()` — testa criação válida, `costUSD` negativo lança exceção
- [x] `CostRecord.zero()` — retorna record zerado
- [x] `CostRecordValidationException` — mensagem de erro correta

**Arquivo**: `src/tokenConsumption/__tests__/domain/CostRecord.test.ts`

---

### T8.2 — Testes unitários de application

**Acceptance Criteria:**

- [x] `CostCaptureService.capture()` — retorna `CostRecord` com custo correto
- [x] `CostCaptureService.capture()` — retorna `CostRecord.zero()` em falha do Helicone
- [x] `CostCaptureService.capture()` — aplica fallback de câmbio em falha do `ExchangeRateAdapter`
- [x] Mock de `IHeliconeCostAdapter` e `IExchangeRateAdapter`

**Arquivo**: `src/tokenConsumption/__tests__/application/CostCaptureService.test.ts`

---

### T8.3 — Testes unitários de infrastructure

**Acceptance Criteria:**

- [x] `HeliconeCostAdapter` — mock de `fetch`, retorna `cost_usd` corretamente
- [x] `HeliconeCostAdapter` — erro de rede retorna `0`
- [x] `ExchangeRateAdapter` — mock de `fetch`, retorna taxa corretamente
- [x] `ExchangeRateAdapter` — payload inválido retorna fallback `6.0`
- [x] `ModelProviderFactory.create('gpt-4o-mini', userId)` — instancia `ChatOpenAI` com `baseURL` Helicone
- [x] `ModelProviderFactory.create('gemini-2.0-flash', userId)` — instancia `ChatGoogleGenerativeAI` com `baseUrl` Helicone

**Arquivos**:

- `src/tokenConsumption/__tests__/infrastructure/HeliconeCostAdapter.test.ts`
- `src/tokenConsumption/__tests__/infrastructure/ExchangeRateAdapter.test.ts`
- `src/agent/__tests__/infrastructure/ModelProviderFactory.test.ts`

---

### T8.4 — Testes de integração do pipeline de custo

**Acceptance Criteria:**

- [x] Pipeline completo: evento enfileirado → consumer processa → custo capturado → persistido no banco
- [x] Verificar `costUSD > 0` quando `HeliconeCostAdapter` retorna valor real
- [x] Verificar `costUSD = 0` quando `heliconeRequestId` é null
- [x] Usar mocks de Redis e PostgreSQL in-memory (sem dependência de serviços reais em CI)

**Arquivo**: `src/tokenConsumption/__tests__/integration/CostCapturePipeline.test.ts`

---

### T8.5 — Teste do endpoint `GET /api/costs/summary`

**Acceptance Criteria:**

- [x] GET sem `userId` → 200 (sumário global)
- [x] GET com `userId` inválido (não UUID) → 400
- [x] GET com `userId` válido → 200 + payload correto
- [x] Soma de custo calculada a partir do banco (mock do repository)

**Arquivo**: `src/app/api/costs/summary/__tests__/route.test.ts`

---

## Fase 9 — Validação Final

### T9.1 — Validação TypeScript e testes

**Acceptance Criteria:**

- [x] `npx tsc --noEmit` sem erros
- [x] `pnpm test` passa (todos os testes)
- [x] Nenhum teste existente quebrado

### T9.2 — Atualizar seeds com dados de custo

**Acceptance Criteria:**

- [x] Seed existente em `src/tokenConsumption/infrastructure/db/seeds/` atualizado
- [x] Registros incluem valores realistas de `cost_usd` (ex: 0.0001–0.01), `cost_brl` e `exchange_rate_at_execution`

---

## Ordem de execução recomendada

```
T1.1 → T1.2
  → T2.1 → T2.2
    → T3.1 → T3.2 → T3.3
      → T4.1 → T4.2
        → T5.1 → T5.2 → T5.3
          → T6.1
            → T7.3 → T7.2 → T7.1
              → T8.1 → T8.2 → T8.3 → T8.4 → T8.5
                → T9.1 → T9.2
```

---

## Complexidade Estimada

| Task   | Complexidade | Observação                                      |
| ------ | ------------ | ----------------------------------------------- |
| T1.1   | Baixa        | Apenas variável de ambiente                     |
| T1.2   | Média        | Factory + integração com LangGraph existente    |
| T2.1   | Baixa        | Alteração no schema Drizzle                     |
| T2.2   | Baixa        | Comando Drizzle                                 |
| T3.1   | Baixa        | Value object com validação simples              |
| T3.2   | Baixa        | Exceção de domínio                              |
| T3.3   | Baixa        | Interfaces                                      |
| T4.1   | Média        | HTTP + parsing + fallback                       |
| T4.2   | Baixa        | HTTP simples + fallback                         |
| T5.1   | Média        | Orquestração com DI                             |
| T5.2   | Baixa        | Extensão de tipo existente                      |
| T5.3   | Média        | Integração com consumer existente               |
| T6.1   | Média        | Extração de metadata do LangChain (pode variar) |
| T7.1   | Baixa        | Route handler simples                           |
| T7.2   | Média        | Query Drizzle com GROUP BY e SUM                |
| T7.3   | Baixa        | Campo + migration                               |
| T8.1–5 | Alta (total) | Cobertura completa de casos nominais e falha    |
| T9.1   | Baixa        | Validação final                                 |
| T9.2   | Baixa        | Atualização de seed                             |
