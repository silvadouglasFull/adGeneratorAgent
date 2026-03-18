# Tasks: Exibição do Custo de Geração no Resultado do Anúncio

**Spec**: `openspec/specs/ad-cost-display.md`
**Dependências implementadas**: Helicone Immutable Cost Tracking (todas as fases)

---

## Fase 1 — Backend: Captura Inline de Custo na Rota

### T1.1 — Expor `CostCaptureService` no container de Token Consumption

**Acceptance Criteria:**

- [ ] `tokenConsumptionContainer` em `src/tokenConsumption/tokenConsumption.ts` exporta `costCaptureService`
- [ ] TypeScript compila sem erros
- [x] `tokenConsumptionContainer` em `src/tokenConsumption/tokenConsumption.ts` exporta `costCaptureService`
- [x] TypeScript compila sem erros

**Detalhes:**

- O `CostCaptureService` já é instanciado no container — apenas precisa ser exposto na exportação `tokenConsumptionContainer`

---

### T1.2 — Chamar `CostCaptureService.capture()` na rota de geração

**Acceptance Criteria:**

- [ ] Em `src/app/api/agent/generate/route.ts`, após o stream finalizar:
- [x] Em `src/app/api/agent/generate/route.ts`, após o stream finalizar:
  - Se `heliconeRequestId` disponível, chama `costCaptureService.capture(heliconeRequestId)`
  - Extrai `costBRL` do `CostRecord` retornado
  - Se `heliconeRequestId` ausente ou captura falhar, `costBRL = null`
- [x] `costBRL` incluído no payload do evento SSE `done`:
  ```json
  { "type": "done", "metadata": { ..., "costBRL": 0.000252 } }
  ```
- [x] Captura não bloqueia o fluxo — falha resulta em `costBRL: null`
- [x] TypeScript compila sem erros

**Detalhes:**

```typescript
let costBRL: number | null = null;
if (generationResult?.heliconeRequestId) {
  try {
    const costRecord =
      await tokenConsumptionContainer.costCaptureService.capture(
        generationResult.heliconeRequestId,
      );
    costBRL = costRecord.costBRL > 0 ? costRecord.costBRL : null;
  } catch {
    costBRL = null;
  }
}
```

- Inserir **antes** do envio do evento `done`
- A captura via fila Redis continua funcionando em paralelo (sem alteração)

---

## Fase 2 — Frontend: Exibição do Custo na UI

### T2.1 — Atualizar tipo `AdResponse` e parsing do SSE

**Acceptance Criteria:**

- [x] Interface `AdResponse` em `src/app/page.tsx` atualizada:
  ```typescript
  metadata: {
    model?: string;
    generatedAt?: string;
    imageModel?: string;
    costBRL?: number | null;
  }
  ```
- [x] Parsing do evento `done` captura `metadata.costBRL`
- [x] TypeScript compila sem erros

---

### T2.2 — Exibir custo no header do resultado

**Acceptance Criteria:**

- [x] Custo exibido no trecho do header do resultado, entre modelo e data:
  ```tsx
  {
    result.metadata.costBRL != null &&
      ` · R$ ${result.metadata.costBRL.toFixed(4)}`;
  }
  ```
- [x] Formato: `R$ 0,0003` (4 casas decimais)
- [x] Custo omitido quando `costBRL` é `null` ou `undefined`
- [x] Layout não quebra com ou sem custo

**Detalhes:**

```tsx
<span className="text-xs text-gray-400">
  {result.metadata.model}
  {result.metadata.imageModel && ` + ${result.metadata.imageModel}`}
  {result.metadata.costBRL != null &&
    ` · R$ ${result.metadata.costBRL.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
  {" · "}
  {new Date(result.metadata.generatedAt).toLocaleString("pt-BR")}
</span>
```

---

## Fase 3 — Testes

### T3.1 — Teste da rota: evento `done` inclui `costBRL`

**Acceptance Criteria:**

- [x] Teste existente em `src/app/api/agent/generate/__tests__/route.test.ts` atualizado ou novo teste adicionado:
  - Stream com `heliconeRequestId` → evento `done` contém `costBRL` numérico
  - Stream sem `heliconeRequestId` → evento `done` contém `costBRL: null`
- [x] Mock do `CostCaptureService.capture()` retorna `CostRecord` com `costBRL > 0`
- [x] Mock de falha no `CostCaptureService` → `costBRL: null` (sem erro no stream)
- [x] Testes existentes continuam passando

**Arquivo**: `src/app/api/agent/generate/__tests__/route.test.ts`

---

### T3.2 — Validação TypeScript e testes completos

**Acceptance Criteria:**

- [x] `npx tsc --noEmit` sem erros
- [x] `pnpm test` passa (todos os testes, nenhuma regressão)

---

## Ordem de execução recomendada

```
T1.1 → T1.2 → T2.1 → T2.2 → T3.1 → T3.2
```

## Complexidade Estimada

| Task | Complexidade | Observação                                  |
| ---- | ------------ | ------------------------------------------- |
| T1.1 | Baixa        | Apenas expor instância no container         |
| T1.2 | Média        | Integração inline com fallback na rota      |
| T2.1 | Baixa        | Atualização de tipo + parsing               |
| T2.2 | Baixa        | Formatação e exibição condicional           |
| T3.1 | Média        | Mocking do CostCaptureService + SSE parsing |
| T3.2 | Baixa        | Validação final                             |
