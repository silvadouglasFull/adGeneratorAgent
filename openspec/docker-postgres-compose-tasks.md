# Tasks: Container PostgreSQL com Docker Compose

Spec de referência: `openspec/specs/docker-postgres-compose.md`
Spec obrigatória de padrões: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Preparação

### T1 — Definir contrato de ambiente

- [x] Confirmar variáveis obrigatórias: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- [x] Criar `.env.example` com placeholders
- [x] Garantir que `.env` e `.env.local` estejam ignorados no versionamento
- **Critério**: variáveis obrigatórias documentadas e sem segredos commitados ✅

---

## Fase 2 — Implementação do Docker Compose

### T2 — Criar serviço PostgreSQL

- [x] Criar `docker-compose.yml` com serviço `postgres`
- [x] Definir imagem oficial do PostgreSQL (tag estável)
- [x] Configurar `container_name` e `restart` adequado para dev
- [x] Mapear porta `${POSTGRES_PORT}:5432`
- **Critério**: `docker compose config` sem erros ✅

### T3 — Configurar variáveis de ambiente com fallback

- [x] Configurar leitura de `.env` e `.env.local`
- [x] Definir precedência de `.env.local` sobre `.env` quando ambos existirem
- [x] Injetar credenciais no container via `environment`/`env_file`
- **Critério**: container sobe com credenciais corretas no cenário `.env` e no cenário `.env.local` ✅

### T4 — Adicionar persistência e healthcheck

- [x] Criar volume nomeado para dados (`postgres_data`)
- [x] Anexar volume em `/var/lib/postgresql/data`
- [x] Configurar `healthcheck` com `pg_isready`
- **Critério**: `docker ps` mostra status `healthy` após subida ✅

---

## Fase 3 — Documentação

### T5 — Atualizar README

- [x] Documentar pré-requisitos (Docker e Compose)
- [x] Documentar criação de `.env.local` a partir de `.env.example`
- [x] Documentar comandos de start/stop/logs
- [x] Documentar como testar conexão no banco
- **Critério**: onboarding local executável sem orientação adicional ✅

---

## Fase 4 — Validação

### T6 — Validar cenário com `.env`

- [x] Subir stack com `docker compose up -d`
- [x] Validar variáveis aplicadas e conexão ao banco
- [x] Reiniciar container e validar persistência
- **Critério**: banco acessível e persistente ✅

### T7 — Validar cenário com `.env.local`

- [x] Configurar valores diferentes em `.env.local`
- [x] Subir stack e validar uso das credenciais de `.env.local`
- [x] Confirmar precedência sobre `.env`
- **Critério**: credenciais ativas correspondem a `.env.local` ✅

### T8 — Checklist final

- [x] `docker compose config` válido
- [x] `docker compose up -d` e `docker compose down` funcionando
- [x] Container `postgres` saudável
- [x] README e `.env.example` atualizados
- [x] Sem segredos reais no repositório
- **Critério**: feature pronta para uso por qualquer dev do time ✅

---

## Ordem de execução sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

## Estimativa de complexidade

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T1   | Baixa        | 20min   |
| T2   | Baixa        | 20min   |
| T3   | Média        | 30min   |
| T4   | Baixa        | 15min   |
| T5   | Baixa        | 20min   |
| T6   | Baixa        | 20min   |
| T7   | Baixa        | 20min   |
| T8   | Baixa        | 10min   |

**Total Estimado**: ~2h 35min
