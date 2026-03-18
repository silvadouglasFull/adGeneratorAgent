# Spec: Backfill de Custos de Token via Helicone

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`
Spec dependente: `openspec/specs/helicone-immutable-cost-tracking.md`

---

## Visão Geral

Criar um endpoint operacional para recalcular e atualizar custos de gerações que foram persistidas com `helicone_request_id` válido, porém com `cost_usd = 0` e `cost_brl = 0` por latência de consistência eventual da API do Helicone.

## Problema

Em alguns casos, a captura de custo ocorre antes do Helicone materializar o campo `cost`. Isso causa persistência inicial com custo zero. Como o repositório usa idempotência por `request_id`, o registro não é regravado automaticamente depois.

## Objetivo

1. Disponibilizar endpoint específico para backfill manual/operacional.
2. Buscar registros elegíveis (`helicone_request_id` não nulo e custo zero).
3. Reconsultar custo via `CostCaptureService` e atualizar registro quando `costUSD > 0`.
4. Retornar sumário de execução (`scanned`, `updated`, `skipped`, `failed`).

## Escopo

### Incluso

- Endpoint `POST /api/costs/backfill`
- Serviço de aplicação para orquestrar backfill
- Repositório de infraestrutura para seleção e atualização de pendências
- Testes de serviço e rota

### Fora de escopo

- Job automático agendado (cron)
- Backfill de custos de imagem sem `helicone_request_id`
- Processamento em lote distribuído

## Contrato do Endpoint

### Request

`POST /api/costs/backfill`

Body JSON opcional:

```json
{
  "limit": 50
}
```

Regras:

- `limit` opcional, default `50`
- mínimo `1`, máximo `500`

### Response 200

```json
{
  "scanned": 10,
  "updated": 7,
  "skipped": 2,
  "failed": 1
}
```

### Response 400

- Body inválido
- `limit` fora do intervalo permitido

## Regras de Backfill

- Selecionar apenas registros com:
  - `helicone_request_id` não nulo
  - `cost_usd = 0`
- Para cada registro elegível:
  - chamar `CostCaptureService.capture(helicone_request_id)`
  - se `costUSD > 0`, atualizar `cost_usd`, `cost_brl`, `exchange_rate_at_execution`
  - se `costUSD = 0`, marcar como `skipped`
  - em erro de processamento, marcar como `failed` e continuar lote

## Critérios de Aceitação

- [ ] Existe endpoint `POST /api/costs/backfill`
- [ ] Endpoint valida `limit` e retorna 400 para input inválido
- [ ] Backfill atualiza registros elegíveis quando custo for maior que zero
- [ ] Registros sem custo materializado continuam sem atualização (skipped)
- [ ] Processamento resiliente: falha em item não interrompe lote
- [ ] Testes de rota e serviço cobrindo sucesso/validação/falha parcial
- [ ] `pnpm test` passa
- [ ] `npx tsc --noEmit` passa

## Definição de Pronto (DoD)

- Endpoint operacional criado e testado
- Sem regressão nos testes existentes
- Type-check limpo
- Documentação (spec + tasks) atualizada
