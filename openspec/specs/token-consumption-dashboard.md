# Spec: Dashboard de Consumo de Tokens e Custo por Token

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Implementar um dashboard interativo e fácil de compreender para visualizar consumo de tokens e custo por token dos anúncios gerados.

A interface deve seguir o padrão visual atual do sistema, respeitando os tokens/classes já usados no projeto (ex.: `text-indigo-700`, `text-gray-900`, `text-gray-700`, `text-gray-100` e variações equivalentes já existentes no design).

## Contexto

O projeto já possui persistência de consumo e custos em `token_consumptions` e endpoint de resumo (`GET /api/costs/summary`).

Esta feature adiciona uma visualização analítica dedicada em dashboard com foco em clareza operacional.

## Objetivo da Feature

1. Exibir consumo total de tokens de todos os anúncios em gráfico de barras;
2. Exibir consumo de tokens por anúncio em gráfico de barras;
3. Exibir consumo total em reais por token (agregado) em gráfico de barras;
4. Exibir consumo em reais por token de cada anúncio em gráfico de barras.

## Escopo

### Incluído

- Nova página de dashboard (App Router);
- Componentes visuais usando Tremor para gráficos de barras;
- Endpoint de dados para o dashboard com métricas agregadas e por anúncio;
- Cálculo de `realPorToken` no backend para evitar divergência de regra na UI;
- Estados de loading/erro/sem dados na página.

### Não incluído

- Novos filtros avançados (por período customizado, provider, modelo etc.);
- Exportação CSV/PDF;
- Alteração dos fluxos de geração de anúncio;
- Mudança em regras de captura/persistência de custo existentes.

## Requisitos Funcionais

### RF1 — Página de Dashboard

- Criar página dedicada para dashboard em rota própria;
- Renderizar exatamente 4 gráficos de barras, um para cada métrica solicitada;
- Exibir textos e títulos em português com linguagem simples.

### RF2 — Dados de Consumo de Tokens

- Gráfico 1: consumo total de tokens (valor agregado);
- Gráfico 2: consumo de tokens por anúncio (série por item).

### RF3 — Dados de Custo por Token

- Gráfico 3: consumo total de real por token (agregado);
- Gráfico 4: consumo de real por token por anúncio.

Definição:

- `realPorToken = costBRL / totalTokens`
- Se `totalTokens = 0`, considerar `realPorToken = 0` para evitar divisão inválida.

### RF4 — Endpoint de Dashboard

- Criar endpoint dedicado para alimentar o dashboard (ex.: `GET /api/costs/dashboard`);
- Retornar payload com blocos de dados para os 4 gráficos;
- Endpoint deve suportar `userId` opcional (mesmo padrão de `costs/summary`).

### RF5 — Interatividade e Legibilidade

- Dashboard deve permitir leitura rápida (labels claros, valores formatados);
- Deve permanecer usável em desktop e mobile;
- Deve seguir classes de cor existentes no projeto (sem nova paleta hardcoded fora do padrão atual).

## Requisitos Técnicos

### Tremor + Next.js

- Configurar Tremor seguindo documentação oficial informada pelo solicitante:
  - https://www.tremor.so/docs/getting-started/installation/next
- Usar componentes de gráfico de barras do Tremor compatíveis com a versão instalada no projeto.

### Arquitetura (DDD + SOLID)

- Repositório para leitura de métricas de dashboard separado da rota;
- Camada de aplicação para orquestrar montagem do payload;
- Rota apenas valida input e delega para serviço/repositório.

## Contrato de API (proposto)

### Endpoint

`GET /api/costs/dashboard?userId=<uuid-opcional>`

### Response 200 (exemplo)

```json
{
  "totals": {
    "totalTokens": 120000,
    "totalCostBRL": 34.2,
    "totalRealPerToken": 0.000285
  },
  "tokensByAd": [
    {
      "requestId": "uuid-1",
      "tokens": 1200,
      "generatedAt": "2026-03-18T10:00:00.000Z"
    }
  ],
  "realPerTokenByAd": [
    {
      "requestId": "uuid-1",
      "realPerToken": 0.00031,
      "generatedAt": "2026-03-18T10:00:00.000Z"
    }
  ]
}
```

### Response 400

```json
{ "error": "Query param 'userId' deve ser um UUID válido." }
```

## Estrutura Técnica Esperada

```text
src/
  app/
    dashboard/
      page.tsx
    api/
      costs/
        dashboard/
          route.ts
          __tests__/
            route.test.ts
  components/
    dashboard/
      TokenTotalsBarChart.tsx
      TokensByAdBarChart.tsx
      RealPerTokenTotalsBarChart.tsx
      RealPerTokenByAdBarChart.tsx
  tokenConsumption/
    application/
      service/
        TokenConsumptionDashboardService.ts
    domain/
      service/
        ITokenConsumptionDashboardRepository.ts
    infrastructure/
      persistence/
        TokenConsumptionDashboardRepository.ts
```

## Critérios de Aceitação

- [ ] Existe página de dashboard funcional com 4 gráficos de barras
- [ ] Dashboard usa Tremor configurado para Next.js conforme doc oficial
- [ ] Cores e tipografia seguem padrão existente da aplicação
- [ ] Endpoint `GET /api/costs/dashboard` retorna dados para os 4 gráficos
- [ ] `userId` opcional validado como UUID quando informado
- [ ] Cálculo de `realPorToken` aplicado no backend e refletido na UI
- [ ] UI trata estados de loading, erro e vazio sem quebrar layout
- [ ] Testes de rota e serviço do dashboard passam
- [ ] `pnpm test` passa
- [ ] `npx tsc --noEmit` passa sem erros

## Restrições

- Não inventar métricas além das 4 solicitadas;
- Não introduzir nova paleta de cores fora dos padrões já utilizados no sistema;
- Não alterar comportamento de geração, tracking e backfill já existentes.

## Definição de Pronto (DoD)

1. Dashboard renderiza os 4 gráficos com dados reais;
2. Endpoint e serviço possuem testes cobrindo cenário nominal e validação;
3. Layout mantém consistência visual com o sistema atual;
4. Suite de testes e type-check sem regressões.
