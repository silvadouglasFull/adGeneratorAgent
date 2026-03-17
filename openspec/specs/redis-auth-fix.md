# Spec: Correção de Autenticação Redis no Cliente ioredis

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

O cliente Redis (`redis-client.ts`) conecta ao Redis sem enviar credenciais de autenticação. O container Redis está configurado com ACL (usuário + senha obrigatórios via `docker-compose.yml`), resultando no erro `NOAUTH Authentication required` em toda operação após a conexão TCP.

## Problema Atual

```
✓ Redis conectado
✗ Erro no Redis: ReplyError: NOAUTH Authentication required.
Erro no loop de consumo da fila ReplyError: NOAUTH Authentication required.
```

**Causa raiz:** `redis-client.ts` cria a conexão com `new Redis(redisUrl, { ... })` usando `REDIS_URL=redis://localhost:6379` — sem usuário nem senha. O `docker-compose.yml` configura o Redis com ACL que exige autenticação por `REDIS_USERNAME` e `REDIS_PASSWORD`, desabilitando o usuário `default`.

## Objetivo

Garantir que o cliente ioredis envie credenciais de autenticação (username + password) ao conectar ao Redis, utilizando as variáveis de ambiente já definidas no `.env.local`.

## Escopo

### Incluído

- Atualizar `redis-client.ts` para construir a URL de conexão com credenciais
- Utilizar variáveis `REDIS_USERNAME`, `REDIS_PASSWORD` e `REDIS_PORT` já existentes no `.env.local`
- Manter `REDIS_URL` como override opcional (se definido com credenciais, prevalece)
- Atualizar testes unitários existentes se necessário
- Validar que `pnpm test` e `npx tsc --noEmit` passam

### Não incluído

- Mudanças no `docker-compose.yml` (já está correto)
- Mudanças em variáveis de ambiente (já estão definidas)
- Rotação de credenciais ou mecanismos de segurança adicionais

## Análise Técnica

### Estado atual de `redis-client.ts`

```typescript
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});
```

O fallback `redis://localhost:6379` não inclui credenciais. Mesmo que `REDIS_URL` fosse definido, o valor atual no `.env.local` não inclui `REDIS_URL` com credenciais — apenas `REDIS_USERNAME`, `REDIS_PASSWORD` e `REDIS_PORT` separados.

### Correção esperada

Construir a URL Redis no formato: `redis://<username>:<password>@<host>:<port>` usando as variáveis de ambiente individuais, com fallback para `REDIS_URL` se explicitamente definido.

### Variáveis de ambiente disponíveis

| Variável         | Valor (`.env.local`) |
| ---------------- | -------------------- |
| `REDIS_USERNAME` | `redis_app`          |
| `REDIS_PASSWORD` | `redis_password`     |
| `REDIS_PORT`     | `6379`               |

## Regras de Negócio

### RN1 — Prioridade de configuração

1. Se `REDIS_URL` estiver definido no ambiente, usar diretamente (assume que já contém credenciais)
2. Caso contrário, construir a URL a partir de `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST` (default `localhost`) e `REDIS_PORT` (default `6379`)

### RN2 — Credenciais obrigatórias

Se `REDIS_URL` não estiver definido e `REDIS_PASSWORD` não estiver definido, o cliente deve logar um aviso mas ainda assim tentar conectar (compatibilidade com Redis sem autenticação em ambientes de desenvolvimento).

## Critérios de Aceitação

- [x] O cliente Redis conecta com sucesso usando as credenciais do `.env.local`
- [x] O consumer da fila (`blpop`) funciona sem erro `NOAUTH`
- [x] O producer da fila (`rpush`) funciona sem erro `NOAUTH`
- [x] O healthcheck do Redis continua `healthy` via `docker compose`
- [x] `REDIS_URL` explícito prevalece sobre variáveis individuais
- [x] `pnpm test` passa (25 suites, 122 testes)
- [x] `npx tsc --noEmit` passa sem erros
- [x] Sem credenciais hardcoded no código-fonte

## Definição de Pronto (DoD)

1. `pnpm dev` + `docker compose up -d` → sem erros `NOAUTH`
2. Tokens de consumo são enfileirados e consumidos com sucesso
3. Testes e type-check verdes
