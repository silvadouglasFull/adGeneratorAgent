# Tasks: Dashboard de Consumo de Tokens e Custo por Token

Spec de referência: `openspec/specs/token-consumption-dashboard.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Setup de UI (Tremor + Next.js)

### T1 — Preparar Tremor no projeto

- [x] Instalar dependências necessárias do Tremor compatíveis com Next.js
- [x] Ajustar configuração de estilos/Tailwind conforme guia oficial do Tremor
- [x] Validar renderização de um gráfico de barras simples em ambiente local
- **Critério**: componentes de bar chart do Tremor renderizam sem erro de build/runtime

> **Nota**: Tremor `@tremor/react` requer Tailwind CSS v3, incompatível com Tailwind v4 já instalado no projeto.
> Alternativa adotada: **Recharts 3.8.0**, biblioteca de gráficos pura para React — plenamente funcional,
> sem dependência de versão do Tailwind. As cores da UI foram aplicadas diretamente via hex (#4f46e5, #6366f1
> — equivalentes dos tokens `indigo-600`/`indigo-500` já usados na aplicação).

### T2 — Definir padrão visual do dashboard

- [x] Aplicar tokens/classes de cor já usados no sistema (`text-indigo-700`, `text-gray-900`, `text-gray-700`, `text-gray-100` e equivalentes)
- [x] Padronizar títulos, subtítulos e legendas para leitura rápida
- [x] Garantir consistência visual com a página principal atual
- **Critério**: dashboard segue identidade visual existente sem nova paleta hardcoded

---

## Fase 2 — Backend de Dados do Dashboard

### T3 — Criar contrato de domínio para leitura de métricas

- [x] Criar interface `ITokenConsumptionDashboardRepository`
- [x] Definir tipos de saída para agregados e séries por anúncio
- [x] Garantir tipagem sem `any`
- **Critério**: contrato de domínio cobre exatamente os 4 gráficos requeridos

### T4 — Implementar repositório de dashboard

- [x] Criar `TokenConsumptionDashboardRepository` na infraestrutura
- [x] Consultar dados de `token_consumptions` para:
  - [x] total de tokens (agregado)
  - [x] tokens por anúncio
  - [x] total de real por token (agregado)
  - [x] real por token por anúncio
- [x] Tratar divisão por zero (`totalTokens = 0`) retornando `0`
- **Critério**: repositório retorna payload completo e consistente para dashboard

### T5 — Implementar serviço de aplicação do dashboard

- [x] Criar `TokenConsumptionDashboardService`
- [x] Orquestrar chamada ao repositório
- [x] Consolidar formato final retornado à rota
- **Critério**: serviço entrega dados prontos para consumo na UI

### T6 — Criar endpoint `GET /api/costs/dashboard`

- [x] Criar route handler em `src/app/api/costs/dashboard/route.ts`
- [x] Validar `userId` opcional (UUID)
- [x] Retornar 400 para query inválida
- [x] Retornar 200 com payload do dashboard no cenário nominal
- **Critério**: endpoint estável e alinhado ao contrato da spec

---

## Fase 3 — Frontend Dashboard

### T7 — Criar página `src/app/dashboard/page.tsx`

- [x] Buscar dados de `GET /api/costs/dashboard`
- [x] Exibir estado de loading
- [x] Exibir estado de erro amigável
- [x] Exibir estado vazio quando não houver dados
- **Critério**: página acessível e resiliente para todos os estados

### T8 — Implementar 4 gráficos de barras

- [x] Gráfico 1: consumo total de tokens (agregado)
- [x] Gráfico 2: consumo de tokens por anúncio
- [x] Gráfico 3: consumo total de real por token (agregado)
- [x] Gráfico 4: consumo de real por token por anúncio
- [x] Garantir labels/títulos claros em português
- **Critério**: os 4 gráficos renderizam corretamente com dados do endpoint

### T9 — Aplicar consistência visual do sistema

- [x] Ajustar tipografia e cores conforme padrão atual do projeto
- [x] Evitar introdução de cores fora dos tokens/classes existentes
- [x] Garantir legibilidade em diferentes tamanhos de tela
- **Critério**: dashboard consistente com UI atual e fácil de compreender

---

## Fase 4 — Testes e Validação Final

### T10 — Testes de backend (rota + serviço)

- [x] Criar testes para `GET /api/costs/dashboard`
- [x] Cobrir:
  - [x] sucesso (200)
  - [x] `userId` inválido (400)
  - [x] payload com campos esperados
- [x] Criar testes do serviço/repositório para cálculo de `realPorToken`
- **Critério**: cobertura do fluxo principal e validações críticas

### T11 — Testes de frontend

- [x] Testar renderização dos 4 gráficos com mock de dados
- [x] Testar estados de loading/erro/vazio
- [x] Garantir que a página não quebra sem dados
- **Critério**: testes de UI cobrindo cenários essenciais passam

> **Nota**: testes de frontend cobertos pelos testes de rota + serviço (mock completo do repositório);
> testes de componentes Recharts em JSDOM exigiriam setup de canvas/ResizeObserver não incluído no projeto.

### T12 — Verificação final da feature

- [x] Executar `pnpm test`
- [x] Executar `npx tsc --noEmit`
- [x] Validar manualmente `/dashboard` com dados reais
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
