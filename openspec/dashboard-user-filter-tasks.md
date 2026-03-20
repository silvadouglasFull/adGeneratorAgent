# Tasks: Dashboard filtrado por usuário autenticado

Spec de referência: `openspec/specs/dashboard-user-filter.md`

---

## T1 — Atualizar `GET /api/costs/dashboard`

- [ ] Em `src/app/api/costs/dashboard/route.ts`:
  - [ ] Importar `getServerSession` de `next-auth` e `authOptions`
  - [ ] Remover leitura de `searchParams.get("userId")` e a validação UUID do query param
  - [ ] Chamar `getServerSession(authOptions)` no início do handler
  - [ ] Se `!session?.user?.id` → retornar `401 { error: "Não autenticado." }`
  - [ ] Usar `session.user.id` como argumento de `dashboardService.getDashboardData()`
- **Critério**: endpoint retorna `401` sem sessão e `200` com dados do usuário logado

---

## T2 — Atualizar testes de `GET /api/costs/dashboard`

- [ ] Em `src/app/api/costs/dashboard/__tests__/route.test.ts`:
  - [ ] Adicionar mock de `next-auth` com `mockGetServerSession`
  - [ ] Adicionar mock de `@/auth/infrastructure/auth/authOptions`
  - [ ] Adicionar teste: sem sessão → `401`
  - [ ] Ajustar teste existente de `200`: mockar sessão com `{ user: { id: "uuid-1" } }` e verificar que `getDashboardData` foi chamado com `"uuid-1"`
  - [ ] Remover / ajustar teste que passava `userId` por query param (se existir)
- **Critério**: todos os testes da rota passam

---

## T3 — TypeScript

- [ ] Executar `npx tsc --noEmit`
- [ ] Resultado: 0 erros
- **Critério**: compilação limpa

---

## T4 — Testes completos

- [ ] Executar `pnpm test`
- [ ] 0 falhas
- **Critério**: sem regressões

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
