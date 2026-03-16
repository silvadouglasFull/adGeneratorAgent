# Spec: Container Redis com Docker Compose e autenticação por usuário/senha

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Adicionar infraestrutura local com Docker Compose para subir um container Redis com acesso protegido por usuário e senha, usando credenciais definidas em variáveis de ambiente lidas de `.env` ou `.env.local`.

## Objetivo

Garantir um Redis local seguro para desenvolvimento, sem credenciais hardcoded no `docker-compose.yml`, com configuração baseada em ambiente e pronta para consumo pela aplicação.

## Escopo

Inclui:

- Definição de serviço Redis no `docker-compose.yml`
- Autenticação Redis por usuário e senha (ACL)
- Leitura de credenciais via `.env` ou `.env.local`
- Exposição de porta configurável
- Persistência de dados em volume nomeado
- Healthcheck do container
- Documentação de uso no `README.md`

Não inclui:

- Redis Cluster/Sentinel
- Estratégias de alta disponibilidade
- Provisionamento de produção
- Mecanismo de rotação automática de credenciais

## Requisitos Funcionais

### RF1 — Subir Redis via Docker Compose

- Deve existir serviço `redis` no `docker-compose.yml`
- Deve usar imagem oficial Redis
- Deve expor porta do Redis de forma configurável por variável de ambiente

### RF2 — Proteção por usuário e senha

- O acesso ao Redis deve exigir autenticação
- Deve existir usuário de aplicação dedicado (não-anônimo)
- A senha deve ser obrigatória
- O Redis não pode aceitar conexão sem credenciais válidas

### RF3 — Credenciais por variáveis de ambiente

- As credenciais devem vir de variáveis de ambiente
- Variáveis mínimas:
  - `REDIS_USERNAME`
  - `REDIS_PASSWORD`
  - `REDIS_PORT`
- As variáveis devem ser carregadas de `.env` ou `.env.local`

### RF4 — Persistência de dados

- Deve existir volume nomeado para persistir dados do Redis
- Reiniciar o container não deve apagar dados persistidos

### RF5 — Saúde e operação

- O serviço deve possuir healthcheck
- O healthcheck deve validar disponibilidade do Redis com autenticação
- Deve ser possível iniciar/parar com comandos padrão do Docker Compose

## Requisitos Não Funcionais

- Não versionar credenciais reais no repositório
- Configuração simples, legível e sem overengineering
- Compatibilidade com Docker Compose v2
- Falhar explicitamente quando variáveis obrigatórias não forem fornecidas

## Arquivos Esperados

- `docker-compose.yml` (serviço Redis)
- Atualização de `README.md` com instruções de uso

## Contrato de Variáveis de Ambiente

Variáveis obrigatórias:

- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `REDIS_PORT`

Exemplo:

```env
REDIS_USERNAME=redis_app
REDIS_PASSWORD=redis_secret
REDIS_PORT=6379
```

## Critérios de Aceitação

- [x] Existe serviço `redis` no `docker-compose.yml`
- [x] O serviço exige autenticação por usuário e senha
- [x] Credenciais são lidas de `.env` ou `.env.local`
- [x] O Redis não aceita conexão sem autenticação
- [x] Conexão com credenciais válidas funciona
- [x] `docker compose up -d` inicia sem erro
- [x] `docker ps` mostra container em estado saudável (`healthy`)
- [x] Dados persistem após reinício do container
- [x] Credenciais reais não são commitadas
- [x] README documenta setup e comandos de operação

## Definição de Pronto (DoD)

1. Container Redis sobe via Docker Compose
2. Acesso protegido por usuário e senha validado
3. Variáveis de ambiente carregadas corretamente de `.env` ou `.env.local`
4. Persistência e healthcheck validados
5. Documentação de uso atualizada
