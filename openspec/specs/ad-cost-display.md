# Spec: Exibição do Custo de Geração no Resultado do Anúncio

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`
Spec dependente: `openspec/specs/helicone-immutable-cost-tracking.md`

---

## Visão Geral

Exibir no resultado do anúncio gerado o custo em reais (BRL) que aquela geração consumiu, diretamente no metadata do evento SSE `done` e na interface do usuário.

## Problema

Atualmente, o custo de cada geração é capturado de forma assíncrona via fila Redis e persistido no banco, mas **não é retornado ao usuário** no momento em que o anúncio é exibido. O usuário não tem visibilidade do custo individual de cada geração.

## Objetivo

1. **Capturar o custo inline** na rota `POST /api/agent/generate` após o stream do LLM finalizar, usando o `CostCaptureService` já existente.
2. **Incluir `costBRL` no metadata** do evento SSE `done` retornado ao cliente.
3. **Exibir o custo** na UI ao lado do modelo e data de geração, no formato `R$ X,XXXX`.
4. **Não bloquear** a geração caso a captura de custo falhe — exibir `null` e omitir na UI.

## Escopo

### Incluso

- Chamada inline ao `CostCaptureService.capture()` na rota de geração (quando `heliconeRequestId` disponível)
- Campo `costBRL` no payload do evento SSE `done`
- Exibição formatada do custo na UI (`page.tsx`)
- Tipo `AdResponse` atualizado com `costBRL` opcional
- Testes unitários da rota e da UI

### Fora de escopo

- Alteração do fluxo de persistência via fila Redis (já existe)
- Cálculo de custo de geração de imagem (apenas texto por enquanto)
- Alteração do `CostCaptureService` ou `CostRecord`

## Fluxo

```
Stream LLM finaliza → heliconeRequestId extraído
  → CostCaptureService.capture(heliconeRequestId)
    → CostRecord { costBRL }
  → Inclui costBRL no evento SSE "done" metadata
  → Client recebe metadata.costBRL
  → UI exibe "R$ X,XXXX" ao lado do modelo/data
```

### Fallback

Se `heliconeRequestId` for `null` ou `CostCaptureService.capture()` falhar:

- `costBRL` no metadata será `null`
- UI omite o custo (não exibe "R$ 0,00")

## Contrato SSE — Evento `done` (atualizado)

```json
{
  "type": "done",
  "metadata": {
    "model": "gpt-4o-mini",
    "generatedAt": "2026-03-17T12:00:00.000Z",
    "costBRL": 0.000252,
    "usage": { "inputTokens": 150, "outputTokens": 300, "totalTokens": 450 },
    "imageModel": "gpt-image-1.5",
    "imageUsage": { "inputTokens": 50, "outputTokens": 1 }
  }
}
```

- `costBRL`: `number | null` — custo em reais da geração de texto (não inclui imagem)

## UI — Exibição

Local: header do resultado, ao lado do modelo e data.

```tsx
<span className="text-xs text-gray-400">
  {result.metadata.model}
  {result.metadata.imageModel && ` + ${result.metadata.imageModel}`}
  {result.metadata.costBRL != null &&
    ` · R$ ${result.metadata.costBRL.toFixed(4)}`}
  {" · "}
  {new Date(result.metadata.generatedAt).toLocaleString("pt-BR")}
</span>
```

Formato: `R$ 0,0003` (4 casas decimais, locale pt-BR).

## Critérios de Aceitação

- [x] Rota `POST /api/agent/generate` chama `CostCaptureService.capture()` quando `heliconeRequestId` disponível
- [x] Evento SSE `done` inclui campo `costBRL` no metadata (`number | null`)
- [x] Tipo `AdResponse` em `page.tsx` inclui `costBRL?: number | null` no metadata
- [x] UI exibe custo formatado no header do resultado quando `costBRL` não é `null`
- [x] UI omite custo quando `costBRL` é `null`
- [x] Falha no `CostCaptureService` não impede envio do evento `done` (costBRL = null)
- [x] `npx tsc --noEmit` sem erros
- [x] `pnpm test` passa (todos os testes)
- [x] Testes da rota cobrem cenário com e sem custo

## Definição de Pronto (DoD)

- Critérios de aceitação passam
- Testes automatizados cobrem cenário nominal e fallback
- TypeScript compila sem erros
- Nenhum teste existente quebrado
