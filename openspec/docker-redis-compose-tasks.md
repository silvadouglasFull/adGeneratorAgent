# Tasks: Container Redis com Docker Compose

Spec de referência: `openspec/specs/docker-redis-compose.md`
Spec obrigatória de padrões: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Preparação

### T1 — Definir contrato de variáveis de ambiente

- [ ] Confirmar variáveis obrigatórias: `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_PORT`
- [ ] Definir qual arquivo de ambiente será usado no run (`.env.local` por padrão, `.env` opcional)
- [ ] Garantir que credenciais reais não serão versionadas
- **Critério**: contrato de env definido e sem segredos no git

---

## Fase 2 — Implementação no Docker Compose

### T2 — Adicionar serviço Redis

- [ ] Criar/atualizar serviço `redis` no `docker-compose.yml`
- [ ] Usar imagem oficial do Redis (tag estável)
- [ ] Expor porta via variável (`${REDIS_PORT}:6379`)
- [ ] Definir `restart` apropriado para desenvolvimento
- **Critério**: `docker compose config` válido

### T3 — Configurar autenticação por usuário e senha (ACL)

- [ ] Configurar inicialização do Redis para exigir autenticação
- [ ] Criar usuário de aplicação com ACL e senha via env
- [ ] Remover/limitar acesso sem autenticação
- [ ] Garantir que conexão sem credenciais falha
- **Critério**: autenticação obrigatória funcionando

### T4 — Persistência e healthcheck

- [ ] Criar volume nomeado para persistir dados
- [ ] Mapear volume no diretório de dados do Redis
- [ ] Adicionar healthcheck autenticado (ex.: `redis-cli ... ping` com credenciais)
- **Critério**: container sobe e fica `healthy`

---

## Fase 3 — Documentação

### T5 — Atualizar README

- [ ] Documentar variáveis obrigatórias para Redis
- [ ] Documentar comandos de subir/parar com `--env-file .env.local`
- [ ] Documentar alternativa com `.env`
- [ ] Documentar teste de conexão autenticada
- **Critério**: setup local executável sem suporte adicional

---

## Fase 4 — Validação

### T6 — Validar cenário com `.env.local`

- [ ] Subir com `docker compose --env-file .env.local up -d`
- [ ] Verificar healthcheck `healthy`
- [ ] Validar acesso com usuário/senha corretos
- [ ] Validar falha sem autenticação ou com credenciais inválidas
- [ ] Derrubar com `docker compose --env-file .env.local down`
- **Critério**: segurança e operação validadas

### T7 — Validar cenário com `.env`

- [ ] Subir com `docker compose --env-file .env up -d`
- [ ] Repetir validações de autenticação e saúde
- [ ] Confirmar comportamento equivalente ao `.env.local`
- **Critério**: feature funcional em ambos arquivos de ambiente

### T8 — Checklist final

- [ ] `docker compose config` sem erros
- [ ] Redis exige usuário/senha para conexão
- [ ] Dados persistem após restart
- [ ] README atualizado
- [ ] Sem credenciais reais no versionamento
- **Critério**: feature pronta para uso pelo time

---

## Ordem de execução sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

## Estimativa de complexidade

| Task | Complexidade | Esforço |
| ---- | ------------ | ------- |
| T1   | Baixa        | 15min   |
| T2   | Baixa        | 20min   |
| T3   | Média        | 35min   |
| T4   | Baixa        | 20min   |
| T5   | Baixa        | 20min   |
| T6   | Média        | 30min   |
| T7   | Baixa        | 20min   |
| T8   | Baixa        | 10min   |

**Total Estimado**: ~2h 50min
