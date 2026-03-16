# Tasks: Container PostgreSQL com Docker Compose

Spec de referência: `openspec/specs/docker-postgres-compose.md`
Spec obrigatória de padrões: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Preparação

### T1 — Definir contrato de ambiente

- [ ] Confirmar variáveis obrigatórias: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- [ ] Criar `.env.example` com placeholders
- [ ] Garantir que `.env` e `.env.local` estejam ignorados no versionamento
- **Critério**: variáveis obrigatórias documentadas e sem segredos commitados

---

## Fase 2 — Implementação do Docker Compose

### T2 — Criar serviço PostgreSQL

- [ ] Criar `docker-compose.yml` com serviço `postgres`
- [ ] Definir imagem oficial do PostgreSQL (tag estável)
- [ ] Configurar `container_name` e `restart` adequado para dev
- [ ] Mapear porta `${POSTGRES_PORT}:5432`
- **Critério**: `docker compose config` sem erros

### T3 — Configurar variáveis de ambiente com fallback

- [ ] Configurar leitura de `.env` e `.env.local`
- [ ] Definir precedência de `.env.local` sobre `.env` quando ambos existirem
- [ ] Injetar credenciais no container via `environment`/`env_file`
- **Critério**: container sobe com credenciais corretas no cenário `.env` e no cenário `.env.local`

### T4 — Adicionar persistência e healthcheck

- [ ] Criar volume nomeado para dados (`postgres_data`)
- [ ] Anexar volume em `/var/lib/postgresql/data`
- [ ] Configurar `healthcheck` com `pg_isready`
- **Critério**: `docker ps` mostra status `healthy` após subida

---

## Fase 3 — Documentação

### T5 — Atualizar README

- [ ] Documentar pré-requisitos (Docker e Compose)
- [ ] Documentar criação de `.env.local` a partir de `.env.example`
- [ ] Documentar comandos de start/stop/logs
- [ ] Documentar como testar conexão no banco
- **Critério**: onboarding local executável sem orientação adicional

---

## Fase 4 — Validação

### T6 — Validar cenário com `.env`

- [ ] Subir stack com `docker compose up -d`
- [ ] Validar variáveis aplicadas e conexão ao banco
- [ ] Reiniciar container e validar persistência
- **Critério**: banco acessível e persistente

### T7 — Validar cenário com `.env.local`

- [ ] Configurar valores diferentes em `.env.local`
- [ ] Subir stack e validar uso das credenciais de `.env.local`
- [ ] Confirmar precedência sobre `.env`
- **Critério**: credenciais ativas correspondem a `.env.local`

### T8 — Checklist final

- [ ] `docker compose config` válido
- [ ] `docker compose up -d` e `docker compose down` funcionando
- [ ] Container `postgres` saudável
- [ ] README e `.env.example` atualizados
- [ ] Sem segredos reais no repositório
- **Critério**: feature pronta para uso por qualquer dev do time

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
