# Spec: Container PostgreSQL com Docker Compose e variáveis de ambiente

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Adicionar infraestrutura local com Docker Compose para subir um container PostgreSQL, usando credenciais definidas em variáveis de ambiente lidas de `.env` ou `.env.local`.

## Objetivo

Permitir que o projeto tenha um banco PostgreSQL local padronizado para desenvolvimento, com configuração por ambiente e sem hardcode de credenciais.

## Escopo

Inclui:

- Definição de um `docker-compose.yml` com serviço PostgreSQL
- Leitura de variáveis de ambiente a partir de `.env` e/ou `.env.local`
- Volume persistente para dados do banco
- Healthcheck do serviço
- Documentação de uso no projeto

Não inclui:

- Migrações de schema
- Seed de dados
- Integração com ORM
- Ambientes de produção

## Requisitos Funcionais

### RF1 — Subir PostgreSQL via Docker Compose

- Deve existir serviço `postgres` no `docker-compose.yml`
- Deve usar imagem oficial do PostgreSQL
- Deve expor porta configurável por variável de ambiente

### RF2 — Credenciais por variáveis de ambiente

- O serviço deve usar variáveis para:
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_PORT`
- As variáveis devem ser carregadas de `.env` ou `.env.local`
- Quando ambos existirem, `.env.local` deve prevalecer sobre `.env`

### RF3 — Persistência de dados

- Deve existir volume nomeado para persistir dados do PostgreSQL
- Reiniciar o container não pode perder dados do banco

### RF4 — Saúde do container

- O serviço deve ter `healthcheck` com `pg_isready`
- O status deve refletir quando o banco está pronto para conexões

### RF5 — Execução simples

- Deve ser possível subir com um único comando (`docker compose up -d`)
- Deve ser possível derrubar com `docker compose down`

## Requisitos Não Funcionais

- Não versionar credenciais reais
- Manter configuração legível e mínima (sem overengineering)
- Garantir compatibilidade com Docker Compose v2

## Arquivos Esperados

- `docker-compose.yml`
- `.env.example` (com placeholders sem segredo)
- Atualização de documentação em `README.md` (seção de banco local)

## Contrato de Variáveis de Ambiente

Variáveis mínimas:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`

Exemplo:

```env
POSTGRES_DB=ad_generator
POSTGRES_USER=ad_user
POSTGRES_PASSWORD=ad_password
POSTGRES_PORT=5432
```

## Critérios de Aceitação

- [x] Existe `docker-compose.yml` com serviço `postgres`
- [x] O serviço lê variáveis de ambiente de `.env` ou `.env.local`
- [x] Se `.env` e `.env.local` coexistirem, `.env.local` tem precedência
- [x] `docker compose up -d` inicia o PostgreSQL sem erro
- [x] `docker ps` mostra container em estado `healthy`
- [x] Conexão ao banco funciona com credenciais definidas no env
- [x] Dados persistem após reinício do container
- [x] Credenciais reais não são commitadas
- [x] `.env.example` documenta as variáveis obrigatórias
- [x] README descreve como subir/parar o banco local

## Definição de Pronto (DoD)

1. Subida e parada do serviço funcionando localmente
2. Variáveis carregadas corretamente de ambiente
3. Persistência e healthcheck validados
4. Documentação mínima atualizada
5. Sem segredos em arquivos versionados
