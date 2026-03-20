# Spec: Prompts Personalizados por Usuário

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Implementar um sistema de prompts personalizados por usuário, permitindo que usuários autenticados criem, armazenem e utilizem seus próprios prompts no agente de geração de anúncios. Os prompts são armazenados em banco de dados PostgreSQL e sincronizados em Redis para acesso rápido pelo agente.

## Problema Atual

O agente utiliza prompts fixos definidos em código (`adGeneratorPrompt` e `imageDirectorPrompt`). Não há capacidade de usuários personalizarem esses prompts conforme suas necessidades de negócio.

## Objetivo da Feature

1. Permitir que usuários autenticados criem múltiplos prompts personalizados;
2. Permitir que usuários definam **apenas um prompt ativo** por tipo (TEXT_GENERATION ou IMAGE_GENERATION);
3. Categorizar prompts por tipo (enum: `TEXT_GENERATION`, `IMAGE_GENERATION`);
4. Armazenar prompts em banco PostgreSQL associados a usuário com flag de ativação;
5. Sincronizar prompts ativos para Redis para acesso rápido pelo agente;
6. O agente detecta intenção do usuário e aplica prompts ativos quando disponíveis;
7. Se nenhum prompt ativo existir para o tipo, lançar erro com mensagem clara;
8. Fornecer interface de criação/edição de prompts com marcação de ativação.

## Escopo

### Incluído

- Tabela `user_prompts` no PostgreSQL com campos: `id`, `userId`, `type`, `content`, `isActive`, `createdAt`, `updatedAt`
- Constraint UNIQUE: apenas um prompt com `isActive = true` por usuário e tipo
- Enum `PromptType` com valores: `TEXT_GENERATION`, `IMAGE_GENERATION`
- Serviço de repositório para CRUD de prompts com lógica de ativação
- Cache em Redis com expiração de 24h (apenas prompts ativos)
- Sincronização automática Postgres → Redis ao ativar/desativar prompts
- Detector de intenção melhorado que identifica tipo de prompt necessário
- Busca de prompts **ativos** do Redis com erro se não existente
- Tela de gerenciamento de prompts (apenas autenticados)
- Editor Markdown com `@uiw/react-md-editor`
- Select com tipos de prompts (Flowbite)
- Radio/Checkbox para ativar/desativar prompt
- Botão de salvar prompt
- Link na homepage para tela de prompts
- Testes unitários do serviço de repositório, ativação e tela
- Validação de autenticação na tela

### Não incluído

- Compartilhamento de prompts entre usuários
- Histórico de versões de prompts
- Templates pré-definidos
- Importação/exportação de prompts
- Sugestões de IA para melhorar prompts

## Requisitos Funcionais

### RF1 — Tabela de Usuários e Prompts

- Criar tabela `user_prompts` com relacionamento 1:N com `users` via `userId`
- Campos obrigatórios: `id` (UUID), `userId`, `type` (enum), `content`, `isActive` (boolean, default false), `createdAt`, `updatedAt`
- Validar que `type` é um dos valores enum válidos
- **Constraint UNIQUE**: `UNIQUE (user_id, type) WHERE is_active = true`
  - Garante apenas um prompt ativo por usuário e tipo
  - Permite múltiplos prompts inativos do mesmo tipo
- Índices em `userId`, `type` e `(userId, type, isActive)` para queries rápidas

### RF2 — Enum de Tipos de Prompt

- Criar `PromptType` enum com valores:
  - `TEXT_GENERATION`: para prompts que geram texto do anúncio
  - `IMAGE_GENERATION`: para prompts que geram imagens
- Aplicar como restrição de tipo no Drizzle

### RF3 — Serviço de Repositório

- Implementar `UserPromptRepository` com métodos:
  - `create(userId, type, content)`: cria prompt **inativo** + retorna + não sincroniza Redis
  - `findByUserIdAndType(userId, type)`: busca prompt **ativo** do usuário por tipo
  - `findAllByUserId(userId)`: lista todos os prompts do usuário (ativos e inativos)
  - `setActive(promptId)`: ativa um prompt (desativa outros do mesmo tipo) + ressincroniza Redis
  - `setInactive(promptId)`: desativa um prompt + limpa Redis
  - `update(promptId, content)`: atualiza conteúdo (mantém status ativo/inativo)
  - `delete(promptId)`: deleta e limpa Redis se estava ativo
- Garantir que apenas um prompt ativo por tipo/usuário existe
- Aplicar padrões DDD/SOLID conforme spec de padrões

### RF4 — Cache em Redis

- Chave Redis: `user-prompt:{userId}:{type}` (ex: `user-prompt:uuid-123:TEXT_GENERATION`)
- Valor: conteúdo do prompt **ativo** em texto
- TTL: 24 horas
- **Só armazena prompts ativos**
- Sincronização automática ao ativar/desativar no Postgres
- Limpeza de cache ao desativar um prompt
- Fire-and-forget (não bloqueia operações)

### RF5 — Serviço de Busca de Prompts pelo Agente

- Criar `PromptFetchService` que:
  - Busca prompt **ativo** no Redis
  - Se não encontrar em Redis, consulta Postgres por prompt ativo e tenta sincronizar
  - Se ainda não encontrar prompt ativo, lança `ActivePromptNotFoundError` com mensagem clara
  - Retorna conteúdo do prompt ativo para ser usado no agente
  - Mensagem de erro: `"Nenhum prompt ativo de tipo {type} encontrado para o usuário. Crie e ative um prompt."​`

### RF6 — Detector de Intenção Melhorado

- Melhorar `ImageIntentDetector` para também detectar intenção de geração de texto
- Retornar enum com tipo(s) necessário(s): `TEXT_GENERATION | IMAGE_GENERATION | BOTH`
- Baseado em palavras-chave no input do usuário (ex: "gere uma imagem", "crie um texto", etc)

### RF7 — Integração com Agente

- No grafo LangGraph, substituir `adGeneratorPrompt` e `imageDirectorPrompt` fixos por buscas dinâmicas
- Se usuário informar `model`, buscar prompt do usuário para esse tipo
- Se prompt não existir, lançar erro antes de chamar o LLM
- Passar `sessionUserId` no contexto do agente

### RF8 — Tela de Gerenciamento de Prompts

- Rota: `/app/prompts` (protegida por autenticação)
- Componentes:
  - Select com tipos de prompts (obrigatório)
  - MDEditor para edição de conteúdo
  - Botão "Salvar Novo Prompt"
  - Lista dos prompts existentes do usuário **agrupados por tipo**
  - Para cada tipo, indicar qual prompt está **ativo** (com badge/destacado)
  - Radio button ou toggle para ativar/desativar prompt individual
  - Botão "Deletar" por prompt
  - Botão "Editar" por prompt (abre MDEditor com conteúdo preenchido)
- Validações:
  - Verificar autenticação (redirect para `/auth` se não autenticado)
  - Validar que content não é vazio
  - Impedir desativar um prompt sem ter outro ativo do mesmo tipo
  - Mostrar loading ao salvar/ativar/deletar
  - Mostrar mensagem: "Apenas 1 prompt ativo por tipo"

### RF9 — Link na Homepage

- Adicionar link "Meus Prompts" na nav/header da homepage
- Visível apenas para usuários autenticados
- Link aponta para `/app/prompts`

## Contrato de Alteração do Agente

### Before (prompts fixos)

```typescript
const adGenerationService = new AdGenerationService(
  modelInitializerService,
  adGeneratorPrompt, // fixo em código
);
```

### After (prompts dinâmicos)

```typescript
const promptFetchService = new PromptFetchService(
  redisClient,
  userPromptRepository,
);

// Em cada invocação do agente, passar sessionUserId
streamGeneratedAd({
  input,
  model,
  sessionUserId, // novo parâmetro
  heliconeRequestId,
});
```

## Contrato de Persistência

### Tabela `user_prompts`

```sql
CREATE TABLE user_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('TEXT_GENERATION', 'IMAGE_GENERATION')),
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Constraint: Apenas 1 prompt ativo por usuário e tipo
CREATE UNIQUE INDEX idx_user_prompts_active_unique
  ON user_prompts(user_id, type)
  WHERE is_active = true;

CREATE INDEX idx_user_prompts_user_id ON user_prompts(user_id);
CREATE INDEX idx_user_prompts_type ON user_prompts(type);
CREATE INDEX idx_user_prompts_active ON user_prompts(is_active);
CREATE INDEX idx_user_prompts_user_type_active ON user_prompts(user_id, type, is_active);
```

## Estrutura Técnica Esperada

```text
src/
  prompts/
    domain/
      entity/
        UserPrompt.ts
      enum/
        PromptType.ts
      service/
        PromptFetchService.ts
    application/
      repository/
        UserPromptRepository.ts
      dto/
        CreateUserPromptDTO.ts
    infrastructure/
      postgres/
        UserPromptPostgresRepository.ts

  app/
    prompts/
      page.tsx
      layout.tsx
      PromptEditor.tsx
      PromptsList.tsx

  agent/
    (modificações para usar prompts dinâmicos)
```

## Requisitos Não Funcionais

- Implementação em TypeScript, sem `any` não justificado
- Código organizado conforme DDD/SOLID/Clean Code
- Separação clara de domínio, aplicação e infraestrutura
- Validação de entrada com Zod para formulários
- Testes unitários cobrindo:
  - Criação de prompts
  - Busca de prompts no Redis
  - Erro quando prompt não existe
  - Autenticação na tela
- Loading states na UI
- Mensagens de erro claras e amigáveis
- Sincronização Redis não bloqueia operações no Postgres (fire-and-forget)

## Critérios de Aceitação

- [ ] Existe tabela `user_prompts` no schema com enum `PromptType` e coluna `isActive`
- [ ] Constraint UNIQUE (user_id, type) WHERE is_active = true implementada corretamente
- [ ] Migration criada e aplicada ao banco
- [ ] `UserPromptRepository` implementado com métodos de ativação/desativação
- [ ] Apenas 1 prompt ativo por tipo/usuário (constraint válida)
- [ ] `PromptFetchService` busca **apenas prompts ativos** do Redis
- [ ] Erro `ActivePromptNotFoundError` lançado quando nenhum prompt ativo existe
- [ ] Prompts inativos NÃO são sincronizados para Redis
- [ ] Ativar um prompt desativa todos os outros do mesmo tipo
- [ ] Tela `/app/prompts` acessível apenas para autenticados
- [ ] MDEditor funciona na tela
- [ ] Select com tipos de prompts funciona
- [ ] Criar novo prompt persiste em Postgres (inativo por padrão)
- [ ] Ativar prompt sincroniza para Redis e desativa outros
- [ ] Desativar prompt remove de Redis
- [ ] Editar prompt mantém status de ativação
- [ ] Deletar prompt remove de Postgres e Redis (se ativo)
- [ ] Lista mostra prompts agrupados por tipo com indicador de ativo
- [ ] Agente busca apenas prompts ativos
- [ ] Se prompt ativo não existir, agente retorna erro claro
- [ ] Homepage tem link para `/app/prompts` para usuários autenticados
- [ ] Testes passam com `pnpm test`
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] Autenticação validada em `/app/prompts` (redirect se não autenticado)

## Restrições

- Não inventar requisitos além desta spec
- Não alterar contrato do agente sem atualizar spec
- Não criar prompts globais (sempre por usuário)
- Prompts não servem como fallback: se não existir **ativo** para o usuário, é erro
- Apenas um prompt ativo por tipo/usuário (validação em nível de BD)
- Prompts inativos não são cachados em Redis

## Definição de Pronto (DoD)

1. Tabelas criadas e migrations aplicadas
2. Serviços implementados e testados
3. Tela de prompts funcional and acessível apenas autenticados
4. Agente integrado com prompts dinâmicos
5. Todos os critérios de aceitação atendidos
6. Testes passando com cobertura > 80%
