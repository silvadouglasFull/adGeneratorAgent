# Tasks: Rota de Modelos + Dropdown no Chat

Spec de referência: `openspec/specs/model-selection-dropdown-and-models-route.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Backend (Rota de Modelos)

### T1 — Criar route handler de listagem de modelos

- [ ] Criar `src/app/api/agent/models/route.ts`
- [ ] Implementar método `GET`
- [ ] Integrar com serviço de catálogo de modelos existente
- [ ] Retornar payload `{ models: [...] }` padronizado para a UI
- [ ] Tratar erros com status 500 e mensagem amigável
- **Critério**: `GET /api/agent/models` retorna 200 com lista de modelos

### T2 — Cobrir testes da rota

- [ ] Criar `src/app/api/agent/models/__tests__/route.test.ts`
- [ ] Testar sucesso (200 + lista)
- [ ] Testar erro interno (500 + mensagem)
- [ ] Testar estrutura do payload retornado
- **Critério**: testes da rota passam sem chamadas reais a provider externo

---

## Fase 2 — Frontend (Dropdown)

### T3 — Criar componente de dropdown de modelos

- [ ] Criar componente reutilizável de dropdown para modelos de IA
- [ ] Aceitar props para lista de modelos, valor selecionado e callback de mudança
- [ ] Exibir `displayName` e `provider` de forma legível
- [ ] Garantir acessibilidade básica (`label`, navegação por teclado)
- **Critério**: componente renderiza e permite trocar seleção

### T4 — Integrar dropdown na página principal

- [ ] Atualizar `src/app/page.tsx` para buscar modelos na rota `GET /api/agent/models`
- [ ] Popular estado local com modelos retornados
- [ ] Definir fallback para `gpt-4o-mini` quando necessário
- [ ] Exibir feedback de erro de carga de modelos (sem quebrar o formulário)
- **Critério**: página carrega modelos dinamicamente e mantém usabilidade

### T5 — Substituir grid atual pelo dropdown

- [ ] Remover o bloco de grid de botões de seleção de modelo
- [ ] Renderizar apenas o dropdown no mesmo ponto do formulário
- [ ] Manter envio de `model: selectedModel` no `handleSubmit`
- **Critério**: seleção de modelo continua funcionando via dropdown

---

## Fase 3 — Qualidade e Validação

### T6 — Testes do frontend

- [ ] Adicionar/atualizar testes de `page.tsx` para fluxo de seleção de modelo
- [ ] Validar que o modelo selecionado é enviado no body da requisição
- [ ] Validar comportamento de fallback e exibição de erro de carga
- **Critério**: testes de UI cobrindo fluxo principal passam

### T7 — Verificação final

- [ ] Executar `pnpm test`
- [ ] Executar `npx tsc --noEmit`
- [ ] Validar manualmente: selecionar modelo no dropdown e gerar anúncio com sucesso
- **Critério**: sem regressões no fluxo de geração

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
