# Spec: Criação de Prompts Padrão no Cadastro de Usuário

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Ao criar uma conta (via credenciais ou Google), o sistema deve criar automaticamente dois prompts padrão para o novo usuário — um do tipo `TEXT_GENERATION` e outro do tipo `IMAGE_GENERATION` — com conteúdo pré-definido pelas versões de prompt existentes no código-fonte.

A execução desse serviço deve ser **não-bloqueante**: a resposta de criação de conta é devolvida ao usuário imediatamente, sem aguardar a conclusão da criação dos prompts.

---

## Problema Atual

Usuários recém-cadastrados não possuem nenhum prompt no banco de dados. Na primeira geração de anúncio, `PromptFetchService.fetchActivePrompt()` lança `ActivePromptNotFoundError`, bloqueando o uso do agente sem orientação clara.

---

## Objetivo

1. Criar automaticamente os dois prompts padrão (TEXT_GENERATION e IMAGE_GENERATION) ao final do cadastro bem-sucedido;
2. Marcar ambos como `isActive = true`;
3. Não bloquear o fluxo de registro — execução em background (fire-and-forget com log de erro);
4. Suportar os dois fluxos de cadastro: **credenciais** e **Google (OAuth)**.

---

## Conteúdo dos Prompts Padrão

### TEXT_GENERATION

Conteúdo: a constante `instructions` definida em `src/agent/prompt.ts`.

```
# Prompt de Agente de Marketing Imobiliário (Modelo 2026)
...
(conteúdo completo da constante `instructions`)
```

### IMAGE_GENERATION

Conteúdo: o system message definido em `src/agent/imagePrompt.ts` (string do primeiro elemento da mensagem `system`).

---

## Escopo

### Incluído

- Serviço de domínio `DefaultPromptSeeder` em `src/prompts/domain/service/DefaultPromptSeeder.ts`;
- Interface de contrato `IDefaultPromptSeeder`;
- Método único: `seedForUser(userId: string): Promise<void>`;
- Criação dos dois prompts com `isActive = true` usando o repositório existente `IUserPromptRepository`;
- Conteúdo padrão centralizado em `src/prompts/domain/seed/defaultPromptContents.ts`;
- Hook no fluxo de registro de credenciais: `POST /api/auth/register/route.ts` (fire-and-forget após `201`);
- Hook no fluxo de registro Google: callback `signIn` em `authOptions.ts` — após `upsertGoogleUser`, verificar se os prompts já existem antes de semear (idempotente);
- Verificação de idempotência: não criar prompts duplicados se já existirem (para o caso Google que usa `upsert`);
- Testes unitários do `DefaultPromptSeeder`;
- Testes de integração do hook no `POST /api/auth/register`.

### Não incluído

- Criação de prompts padrão para usuários já existentes (backfill);
- Interface na UI para visualizar/restaurar prompts padrão;
- Atualização dos prompts padrão ao mudar o conteúdo de `prompt.ts` / `imagePrompt.ts`.

---

## Requisitos Funcionais

### RF1 — Conteúdo padrão centralizado

- Criar `src/prompts/domain/seed/defaultPromptContents.ts` com as constantes:
  - `DEFAULT_TEXT_GENERATION_PROMPT`: conteúdo do `instructions` de `src/agent/prompt.ts`;
  - `DEFAULT_IMAGE_GENERATION_PROMPT`: conteúdo do system message de `src/agent/imagePrompt.ts`.
- Ambas as constantes são `string` puras, sem dependências de framework.

### RF2 — Serviço `DefaultPromptSeeder`

- Localização: `src/prompts/domain/service/DefaultPromptSeeder.ts`;
- Depende de `IUserPromptRepository`;
- Método `seedForUser(userId: string): Promise<void>`:
  - Para cada tipo (`TEXT_GENERATION`, `IMAGE_GENERATION`):
    1. Verificar se já existe algum prompt do tipo para o usuário (`findByUserIdAndType`);
    2. Se não existir: criar via `repository.create()` com `isActive: true`;
    3. Se já existir: não fazer nada (idempotente).

### RF3 — Hook no registro via credenciais

- Em `src/app/api/auth/register/route.ts`:
  - Após retornar `201`, disparar `promptsContainer.defaultPromptSeeder.seedForUser(user.id)` com `.catch()` que apenas registra o erro no console.
  - **Não** usar `await` — fire-and-forget.

### RF4 — Hook no registro via Google

- Em `src/auth/infrastructure/auth/authOptions.ts`, no callback `signIn` (provider Google):
  - Após `upsertGoogleUser()`, obter o `userId` do usuário criado/encontrado;
  - Disparar `promptsContainer.defaultPromptSeeder.seedForUser(userId)` com `.catch()` para logar o erro;
  - **Não** usar `await` para não bloquear o retorno do `signIn`.
- `upsertGoogleUser()` deve retornar o usuário (com `id`) para que o `userId` esteja disponível.

### RF5 — Idempotência

- `seedForUser` nunca lança erro se os prompts já existirem: verifica antes de criar;
- Seguro de chamar múltiplas vezes para o mesmo usuário.

### RF6 — Sem bloqueio do fluxo principal

- Cadastro via credenciais retorna `201` antes de aguardar os prompts serem criados;
- Callback `signIn` do Google retorna `true` sem aguardar os prompts.

---

## Requisitos Não-Funcionais

- Falha na criação dos prompts padrão **não deve** impedir o cadastro do usuário;
- Erros do seeder devem ser logados com `console.error` contendo contexto (`userId`, tipo, mensagem);
- `DefaultPromptSeeder` não depende de Redis — trabalha apenas com PostgreSQL via repositório;
- Código sem `any`.

---

## Modelo de Dados

Reutiliza a tabela `user_prompts` existente. Nenhuma migration necessária.

---

## Critérios de Aceitação

| #   | Critério                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CA1 | Após cadastro via credenciais, dois prompts existem no banco para o usuário: um `TEXT_GENERATION` e um `IMAGE_GENERATION`, ambos com `isActive = true` |
| CA2 | Após primeiro login via Google, dois prompts existem no banco para o usuário                                                                           |
| CA3 | O endpoint `POST /api/auth/register` retorna `201` sem aguardar a criação dos prompts                                                                  |
| CA4 | Se o seeder falhar (ex: DB indisponível), o cadastro ainda é concluído com `201`                                                                       |
| CA5 | Se `seedForUser` for chamado duas vezes para o mesmo usuário, não cria duplicatas                                                                      |
| CA6 | O conteúdo do prompt `TEXT_GENERATION` criado corresponde à constante `DEFAULT_TEXT_GENERATION_PROMPT`                                                 |
| CA7 | O conteúdo do prompt `IMAGE_GENERATION` criado corresponde à constante `DEFAULT_IMAGE_GENERATION_PROMPT`                                               |
| CA8 | `pnpm test` passa sem falhas                                                                                                                           |
| CA9 | `npx tsc --noEmit` retorna 0 erros                                                                                                                     |

---

## Diagrama de Fluxo

### Credenciais

```
POST /api/auth/register
  └─ registerUserWithCredentialsUseCase.execute()
       └─ user criado → retorna 201 ──────────────────────────────► resposta ao cliente
            └─ (fire-and-forget) defaultPromptSeeder.seedForUser(user.id)
                  ├─ findByUserIdAndType(userId, TEXT_GENERATION) → null → create()
                  └─ findByUserIdAndType(userId, IMAGE_GENERATION) → null → create()
```

### Google OAuth

```
NextAuth signIn callback
  └─ upsertGoogleUser() → user
       └─ retorna true ──────────────────────────────────────────► NextAuth continua
            └─ (fire-and-forget) defaultPromptSeeder.seedForUser(user.id)
                  ├─ findByUserIdAndType(userId, TEXT_GENERATION) → null → create()
                  └─ findByUserIdAndType(userId, IMAGE_GENERATION) → null → create()
```

---

## Arquivos a Criar/Modificar

### Criar

| Arquivo                                                            | Descrição                                  |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `src/prompts/domain/seed/defaultPromptContents.ts`                 | Constantes com conteúdo dos prompts padrão |
| `src/prompts/domain/service/DefaultPromptSeeder.ts`                | Serviço de semeadura de prompts padrão     |
| `src/prompts/domain/service/__tests__/DefaultPromptSeeder.test.ts` | Testes unitários do seeder                 |

### Modificar

| Arquivo                                                        | Mudança                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/prompts/promptsContainer.ts`                              | Instanciar e exportar `defaultPromptSeeder`                 |
| `src/app/api/auth/register/route.ts`                           | Disparar seeder fire-and-forget após `201`                  |
| `src/auth/infrastructure/auth/authOptions.ts`                  | Disparar seeder fire-and-forget no callback Google `signIn` |
| `src/auth/domain/service/IUserRepository.ts`                   | Garantir que `upsertGoogleUser` retorna `AuthUser`          |
| `src/auth/infrastructure/persistence/DrizzleUserRepository.ts` | Garantir que `upsertGoogleUser` retorna `AuthUser` com `id` |
| `src/app/api/auth/register/__tests__/route.test.ts`            | Adicionar teste de disparo do seeder                        |
