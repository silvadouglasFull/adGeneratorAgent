# Tasks: Correção de Autenticação Redis no Cliente ioredis

Spec de referência: `openspec/specs/redis-auth-fix.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Correção do Cliente Redis

### T1 — Atualizar `redis-client.ts` para enviar credenciais

- [x] Em `src/tokenConsumption/infrastructure/queue/redis-client.ts`:
  - [x] Ler variáveis `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST` (default `localhost`), `REDIS_PORT` (default `6379`)
  - [x] Se `REDIS_URL` estiver definido, usar diretamente (comportamento atual preservado)
  - [x] Se `REDIS_URL` **não** estiver definido, construir URL no formato `redis://<username>:<password>@<host>:<port>`
  - [x] Se credenciais não estiverem definidas (sem `REDIS_URL` e sem `REDIS_PASSWORD`), usar `redis://localhost:6379` como fallback
- [x] Manter opções existentes (`maxRetriesPerRequest`, `enableReadyCheck`)
- [x] Não adicionar credenciais hardcoded
- **Critério**: `getRedisClient()` retorna cliente autenticado, conexão não gera `NOAUTH`

---

## Fase 2 — Testes

### T2 — Atualizar testes do cliente Redis (se existentes) ou validar mocks

- [x] Verificar se existem testes unitários para `redis-client.ts`
- [x] Se existirem, atualizar mocks para refletir nova lógica de construção de URL
- [x] Se não existirem, garantir que os testes que mockam `getRedisClient` continuam funcionando
- [x] Executar `pnpm test` — todos os testes passam (25 suites, 122 testes)
- **Critério**: nenhuma regressão nos testes existentes

### T3 — Validar TypeScript e execução

- [x] Executar `npx tsc --noEmit` — 0 erros
- [x] Executar `docker compose up -d` — containers saudáveis (postgres healthy, redis healthy)
- [x] Executar `pnpm dev` — sem erros `NOAUTH` no console ✓
- [x] Testar manualmente `POST /api/agent/generate` — tokens enfileirados e consumidos ✓
- **Critério**: fluxo end-to-end funcional sem erros de autenticação Redis

---

## Ordem de Execução

```text
T1 → T2 → T3
```

## Estimativa de Complexidade

| Task | Complexidade | Descrição                            |
| ---- | ------------ | ------------------------------------ |
| T1   | Baixa        | Alterar construção de URL no cliente |
| T2   | Baixa        | Validar testes existentes            |
| T3   | Baixa        | Validação manual end-to-end          |
