# Tasks: Dashboard filtrado por usuário autenticado

Spec de referência: `openspec/specs/dashboard-user-filter.md`

---

## T1 — Atualizar `GET /api/costs/dashboard`

- [x] Em `src/app/api/costs/dashboard/route.ts`:
  - [x] Importar `getServerSession` de `next-auth` e `authOptions`
  - [x] Remover leitura de `searchParams.get("userId")` e a validação UUID do query param
  - [x] Chamar `getServerSession(authOptions)` no início do handler
  - [x] Se `!session?.user?.id` → retornar `401 { error: "Não autenticado." }`
  - [x] Usar `session.user.id` como argumento de `dashboardService.getDashboardData()`
- **Critério**: endpoint retorna `401` sem sessão e `200` com dados do usuário logado ✅

---

## T2 — Atualizar testes de `GET /api/costs/dashboard`

- [x] Em `src/app/api/costs/dashboard/__tests__/route.test.ts`:
  - [x] Adicionar mock de `next-auth` com `mockGetServerSession`
  - [x] Adicionar mock de `@/auth/infrastructure/auth/authOptions`
  - [x] Adicionar teste: sem sessão → `401`
  - [x] Ajustar teste existente de `200`: mockar sessão com `{ user: { id: "uuid-1" } }` e verificar que `getDashboardData` foi chamado com `"uuid-1"`
  - [x] Remover / ajustar teste que passava `userId` por query param (se existir)
- **Critério**: todos os testes da rota passam ✅

---

## T3 — TypeScript

- [x] Executar `npx tsc --noEmit`
- [x] Resultado: 0 erros
- **Critério**: compilação limpa ✅

---

## T4 — Testes completos

- [x] Executar `pnpm test`
- [x] 0 falhas — 49 suites, 241 testes
- **Critério**: sem regressões ✅

---

## Ordem de Execução

```
T1 → T2 → T3 → T4
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T1   | Baixa        |
| T2   | Baixa        |
| T3   | Baixa        |
| T4   | Baixa        |
