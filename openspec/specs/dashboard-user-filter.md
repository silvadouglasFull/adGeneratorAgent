# Spec: Dashboard filtrado por usuário autenticado

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

A dashboard de consumo de tokens deve exibir **exclusivamente os dados do usuário autenticado**. Atualmente, o endpoint `GET /api/costs/dashboard` aceita um `userId` opcional via query param — sem ele, retorna dados de todos os usuários. O `DashboardPageClient` não passa nenhum `userId`, expondo dados globais para qualquer usuário logado.

---

## Problema Atual

1. `GET /api/costs/dashboard` recebe `userId` por query param — qualquer cliente pode omiti-lo ou forjar outro `userId`;
2. `DashboardPageClient` chama `/api/costs/dashboard` sem `userId`, retornando dados agregados de todos os usuários;
3. Não há vínculo entre a sessão autenticada e os dados exibidos.

---

## Objetivo

- O endpoint deve **ignorar query params de userId**;
- O `userId` deve ser extraído **internamente** da sessão (`getServerSession`) no route handler;
- Se não houver sessão ativa, retornar `401`;
- O `DashboardPageClient` não precisa enviar nenhum parâmetro — a API resolve o usuário por conta própria.

---

## Escopo

### Incluído

- Remoção da leitura de `userId` via `searchParams` no route handler;
- Leitura de `userId` via `getServerSession(authOptions)` no route handler;
- Retorno de `401` quando não há sessão ou `session.user.id` não está disponível;
- Remoção da validação de UUID do query param (não mais aplicável);
- `DashboardPageClient` mantido sem alteração de interface — não precisa mais passar `userId`;
- Testes do endpoint atualizados para cobrir: `401` sem sessão, `200` com sessão válida.

### Não incluído

- Filtro de `userId` por query param para admins;
- Paginação ou filtros adicionais no dashboard;
- Qualquer alteração no repositório ou serviço de domínio (a assinatura `getDashboardData(userId?: string)` é preservada).

---

## Requisitos Funcionais

### RF1 — Autenticação obrigatória no endpoint

- `GET /api/costs/dashboard` deve chamar `getServerSession(authOptions)`;
- Se `!session?.user?.id` → retornar `401 { error: "Não autenticado." }`;
- Usar `session.user.id` como `userId` na chamada ao serviço.

### RF2 — Remoção do query param `userId`

- Remover leitura de `searchParams.get("userId")`;
- Remover validação UUID do query param;
- O endpoint não aceita mais `userId` externo.

### RF3 — `DashboardPageClient` sem mudanças de interface

- A chamada `fetch("/api/costs/dashboard")` permanece sem query params;
- Nenhuma prop nova necessária no componente client.

---

## Critérios de Aceitação

| #   | Critério                                                                                      |
| --- | --------------------------------------------------------------------------------------------- |
| CA1 | `GET /api/costs/dashboard` sem sessão retorna `401`                                           |
| CA2 | `GET /api/costs/dashboard` com sessão válida retorna `200` com dados apenas do usuário logado |
| CA3 | Não é possível ver dados de outro usuário passando `?userId=...` na URL                       |
| CA4 | `pnpm test` passa sem falhas                                                                  |
| CA5 | `npx tsc --noEmit` retorna 0 erros                                                            |

---

## Diagrama de Fluxo

```
GET /api/costs/dashboard
  └─ getServerSession(authOptions)
       ├─ session null ou sem user.id → 401
       └─ session.user.id → dashboardService.getDashboardData(userId)
                                └─ retorna dados filtrados do usuário → 200
```

---

## Arquivos a Modificar

| Arquivo                                               | Mudança                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/app/api/costs/dashboard/route.ts`                | Remover query param; adicionar `getServerSession`; retornar `401` sem sessão |
| `src/app/api/costs/dashboard/__tests__/route.test.ts` | Adicionar mock de sessão; cobrir `401`; ajustar testes existentes            |
