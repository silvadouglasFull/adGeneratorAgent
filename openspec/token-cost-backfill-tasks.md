# Tasks: Backfill de Custos de Token via Helicone

**Spec**: `openspec/specs/token-cost-backfill.md`

---

## Fase 1 — Endpoint e Contrato

### T1.1 — Criar endpoint de backfill

**Acceptance Criteria:**

- [ ] Criar `POST /api/costs/backfill` em `src/app/api/costs/backfill/route.ts`
- [ ] Endpoint aceita body opcional com `limit`
- [ ] Default de `limit = 50`
- [x] Criar `POST /api/costs/backfill` em `src/app/api/costs/backfill/route.ts`
- [x] Endpoint aceita body opcional com `limit`
- [x] Default de `limit = 50`

### T1.2 — Validar input do endpoint

**Acceptance Criteria:**

- [ ] Rejeitar body inválido com status 400
- [ ] Rejeitar `limit < 1` ou `limit > 500` com status 400
- [ ] Mensagem de erro clara no payload
- [x] Rejeitar body inválido com status 400
- [x] Rejeitar `limit < 1` ou `limit > 500` com status 400
- [x] Mensagem de erro clara no payload

---

## Fase 2 — Aplicação e Infraestrutura

### T2.1 — Implementar repositório de backfill

**Acceptance Criteria:**

- [ ] Criar repositório para listar pendências com `helicone_request_id` não nulo e `cost_usd = 0`
- [ ] Repositório atualiza custos (`cost_usd`, `cost_brl`, `exchange_rate_at_execution`) por registro
- [ ] Atualização não sobrescreve registros já com custo > 0
- [x] Criar repositório para listar pendências com `helicone_request_id` não nulo e `cost_usd = 0`
- [x] Repositório atualiza custos (`cost_usd`, `cost_brl`, `exchange_rate_at_execution`) por registro
- [x] Atualização não sobrescreve registros já com custo > 0

### T2.2 — Implementar serviço de backfill

**Acceptance Criteria:**

- [ ] Criar serviço de aplicação para processar lote
- [ ] Chamar `CostCaptureService.capture()` por item elegível
- [ ] Retornar sumário com `scanned`, `updated`, `skipped`, `failed`
- [ ] Falha em item não interrompe lote completo
- [x] Criar serviço de aplicação para processar lote
- [x] Chamar `CostCaptureService.capture()` por item elegível
- [x] Retornar sumário com `scanned`, `updated`, `skipped`, `failed`
- [x] Falha em item não interrompe lote completo

---

## Fase 3 — Testes e Validação

### T3.1 — Testar serviço de backfill

**Acceptance Criteria:**

- [ ] Atualiza quando `costUSD > 0`
- [ ] Marca `skipped` quando custo continua zero
- [ ] Marca `failed` quando item falha
- [x] Atualiza quando `costUSD > 0`
- [x] Marca `skipped` quando custo continua zero
- [x] Marca `failed` quando item falha

### T3.2 — Testar rota de backfill

**Acceptance Criteria:**

- [ ] Retorna 200 e sumário no cenário nominal
- [ ] Retorna 400 para input inválido
- [ ] Integra com serviço de backfill
- [x] Retorna 200 e sumário no cenário nominal
- [x] Retorna 400 para input inválido
- [x] Integra com serviço de backfill

### T3.3 — Validação final

**Acceptance Criteria:**

- [ ] `pnpm test` passa
- [ ] `npx tsc --noEmit` passa
- [x] `pnpm test` passa
- [x] `npx tsc --noEmit` passa

---

## Ordem de execução recomendada

```text
T1.1 → T1.2 → T2.1 → T2.2 → T3.1 → T3.2 → T3.3
```
