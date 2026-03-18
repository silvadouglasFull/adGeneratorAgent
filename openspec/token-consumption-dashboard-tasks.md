# Tasks: Dashboard de Consumo de Tokens e Custo por Token

Spec de referência: `openspec/specs/token-consumption-dashboard.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Setup de UI (Tremor + Next.js)

### T1 — Preparar Tremor no projeto

- [ ] Instalar dependências necessárias do Tremor compatíveis com Next.js
- [ ] Ajustar configuração de estilos/Tailwind conforme guia oficial do Tremor
- [ ] Validar renderização de um gráfico de barras simples em ambiente local
- **Critério**: componentes de bar chart do Tremor renderizam sem erro de build/runtime

### T2 — Definir padrão visual do dashboard

- [ ] Aplicar tokens/classes de cor já usados no sistema (`text-indigo-700`, `text-gray-900`, `text-gray-700`, `text-gray-100` e equivalentes)
- [ ] Padronizar títulos, subtítulos e legendas para leitura rápida
- [ ] Garantir consistência visual com a página principal atual
- **Critério**: dashboard segue identidade visual existente sem nova paleta hardcoded

---

## Fase 2 — Backend de Dados do Dashboard

### T3 — Criar contrato de domínio para leitura de métricas

- [ ] Criar interface `ITokenConsumptionDashboardRepository`
- [ ] Definir tipos de saída para agregados e séries por anúncio
- [ ] Garantir tipagem sem `any`
- **Critério**: contrato de domínio cobre exatamente os 4 gráficos requeridos

### T4 — Implementar repositório de dashboard

- [ ] Criar `TokenConsumptionDashboardRepository` na infraestrutura
- [ ] Consultar dados de `token_consumptions` para:
  - [ ] total de tokens (agregado)
  - [ ] tokens por anúncio
  - [ ] total de real por token (agregado)
  - [ ] real por token por anúncio
- [ ] Tratar divisão por zero (`totalTokens = 0`) retornando `0`
- **Critério**: repositório retorna payload completo e consistente para dashboard

### T5 — Implementar serviço de aplicação do dashboard

- [ ] Criar `TokenConsumptionDashboardService`
- [ ] Orquestrar chamada ao repositório
- [ ] Consolidar formato final retornado à rota
- **Critério**: serviço entrega dados prontos para consumo na UI

### T6 — Criar endpoint `GET /api/costs/dashboard`

- [ ] Criar route handler em `src/app/api/costs/dashboard/route.ts`
- [ ] Validar `userId` opcional (UUID)
- [ ] Retornar 400 para query inválida
- [ ] Retornar 200 com payload do dashboard no cenário nominal
- **Critério**: endpoint estável e alinhado ao contrato da spec

---

## Fase 3 — Frontend Dashboard

### T7 — Criar página `src/app/dashboard/page.tsx`

- [ ] Buscar dados de `GET /api/costs/dashboard`
- [ ] Exibir estado de loading
- [ ] Exibir estado de erro amigável
- [ ] Exibir estado vazio quando não houver dados
- **Critério**: página acessível e resiliente para todos os estados

### T8 — Implementar 4 gráficos de barras

- [ ] Gráfico 1: consumo total de tokens (agregado)
- [ ] Gráfico 2: consumo de tokens por anúncio
- [ ] Gráfico 3: consumo total de real por token (agregado)
- [ ] Gráfico 4: consumo de real por token por anúncio
- [ ] Garantir labels/títulos claros em português
- **Critério**: os 4 gráficos renderizam corretamente com dados do endpoint

### T9 — Aplicar consistência visual do sistema

- [ ] Ajustar tipografia e cores conforme padrão atual do projeto
- [ ] Evitar introdução de cores fora dos tokens/classes existentes
- [ ] Garantir legibilidade em diferentes tamanhos de tela
- **Critério**: dashboard consistente com UI atual e fácil de compreender

---

## Fase 4 — Testes e Validação Final

### T10 — Testes de backend (rota + serviço)

- [ ] Criar testes para `GET /api/costs/dashboard`
- [ ] Cobrir:
  - [ ] sucesso (200)
  - [ ] `userId` inválido (400)
  - [ ] payload com campos esperados
- [ ] Criar testes do serviço/repositório para cálculo de `realPorToken`
- **Critério**: cobertura do fluxo principal e validações críticas

### T11 — Testes de frontend

- [ ] Testar renderização dos 4 gráficos com mock de dados
- [ ] Testar estados de loading/erro/vazio
- [ ] Garantir que a página não quebra sem dados
- **Critério**: testes de UI cobrindo cenários essenciais passam

### T12 — Verificação final da feature

- [ ] Executar `pnpm test`
- [ ] Executar `npx tsc --noEmit`
- [ ] Validar manualmente `/dashboard` com dados reais
- **Critério**: sem regressões e pronto para uso

---

## Ordem de Execução Sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T1   | Média        |
| T2   | Baixa        |
| T3   | Baixa        |
| T4   | Alta         |
| T5   | Média        |
| T6   | Baixa        |
| T7   | Baixa        |
| T8   | Média        |
| T9   | Baixa        |
| T10  | Média        |
| T11  | Média        |
| T12  | Baixa        |
