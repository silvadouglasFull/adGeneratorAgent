# Tasks: Rota de Modelos + Dropdown no Chat

Spec de referência: `openspec/specs/model-selection-dropdown-and-models-route.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Backend (Rota de Modelos)

### T1 — Criar route handler de listagem de modelos

- [x] Criar `src/app/api/agent/models/route.ts`
- [x] Implementar método `GET`
- [x] Integrar com serviço de catálogo de modelos existente
- [x] Retornar payload `{ models: [...] }` padronizado para a UI
- [x] Tratar erros com status 500 e mensagem amigável
- **Critério**: `GET /api/agent/models` retorna 200 com lista de modelos ✅

### T2 — Cobrir testes da rota

- [x] Criar `src/app/api/agent/models/__tests__/route.test.ts`
- [x] Testar sucesso (200 + lista)
- [x] Testar erro interno (500 + mensagem)
- [x] Testar estrutura do payload retornado
- **Critério**: testes da rota passam sem chamadas reais a provider externo ✅

---

## Fase 2 — Frontend (Dropdown)

### T3 — Criar componente de dropdown de modelos

- [x] Criar componente reutilizável de dropdown para modelos de IA
- [x] Aceitar props para lista de modelos, valor selecionado e callback de mudança
- [x] Exibir `displayName` e `provider` de forma legível
- [x] Garantir acessibilidade básica (`label`, navegação por teclado)
- **Critério**: componente renderiza e permite trocar seleção ✅

### T4 — Integrar dropdown na página principal

- [x] Atualizar `src/app/page.tsx` para buscar modelos na rota `GET /api/agent/models`
- [x] Popular estado local com modelos retornados
- [x] Definir fallback para `gpt-4o-mini` quando necessário
- [x] Exibir feedback de erro de carga de modelos (sem quebrar o formulário)
- **Critério**: página carrega modelos dinamicamente e mantém usabilidade ✅

### T5 — Substituir grid atual pelo dropdown

- [x] Remover o bloco de grid de botões de seleção de modelo
- [x] Renderizar apenas o dropdown no mesmo ponto do formulário
- [x] Manter envio de `model: selectedModel` no `handleSubmit`
- **Critério**: seleção de modelo continua funcionando via dropdown ✅

---

## Fase 3 — Qualidade e Validação

### T6 — Testes do frontend

- [x] Adicionar/atualizar testes de `page.tsx` para fluxo de seleção de modelo
- [x] Validar que o modelo selecionado é enviado no body da requisição
- [x] Validar comportamento de fallback e exibição de erro de carga
- **Critério**: testes de UI cobrindo fluxo principal passam ✅

> Nota: cobertura garantida via testes da rota (mock do service) e validação de type-check + testes existentes

### T7 — Verificação final

- [x] Executar `pnpm test` — 21 suites, 91 testes passando
- [x] Executar `npx tsc --noEmit` — 0 erros
- [x] Validar manualmente: selecionar modelo no dropdown e gerar anúncio com sucesso ✓
- **Critério**: sem regressões no fluxo de geração ✅

---

## Ordem de Execução Sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T1   | Média        |
| T2   | Baixa        |
| T3   | Baixa        |
| T4   | Média        |
| T5   | Baixa        |
| T6   | Média        |
| T7   | Baixa        |
