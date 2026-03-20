# Spec: Páginas Separadas de Login/Cadastro + Proteção de Rotas Home e Dashboard

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Implementar separação de páginas de autenticação e proteção de acesso para as rotas principais da aplicação.

A funcionalidade deve garantir:

1. Uma página contendo apenas formulário de login;
2. Uma página contendo apenas formulário de criação de conta;
3. Bloqueio de acesso às rotas `/` e `/dashboard` quando o usuário não estiver autenticado.

## Objetivo da Feature

- Melhorar clareza do fluxo de autenticação separando login e cadastro;
- Garantir controle de acesso obrigatório nas páginas principais (`/` e `/dashboard`);
- Redirecionar usuários não autenticados para a tela apropriada de login.

## Escopo

### Incluído

- Página dedicada de login com apenas formulário de login;
- Página dedicada de cadastro com apenas formulário de criar conta;
- Proteção de rota para `/` e `/dashboard`;
- Redirecionamento de não autenticado para rota de login;
- Testes automatizados para comportamento de proteção e acesso.

### Não incluído

- Alteração no modelo de usuários ou migrations;
- Alteração no provider de autenticação (credenciais/google);
- Alteração de regras de negócio de cadastro/login já existentes.

## Requisitos Funcionais

### RF1 — Página exclusiva de login

- Criar rota de página de login (ex.: `/auth/login`);
- A página deve conter somente o formulário de login;
- Não exibir formulário de cadastro nessa página.

### RF2 — Página exclusiva de criar conta

- Criar rota de página de cadastro (ex.: `/auth/signup`);
- A página deve conter somente o formulário de criar conta;
- Não exibir formulário de login nessa página.

### RF3 — Proteção das rotas `/` e `/dashboard`

- Usuário sem sessão válida não pode acessar `/`;
- Usuário sem sessão válida não pode acessar `/dashboard`;
- Ao tentar acessar essas rotas sem login, deve ser redirecionado para página de login.

### RF4 — Acesso autenticado preservado

- Usuário com sessão válida deve acessar `/` e `/dashboard` normalmente;
- Não deve haver regressão no comportamento atual das páginas protegidas.

## Requisitos Não Funcionais

- Implementação em TypeScript sem `any` não justificado;
- Código alinhado com DDD/SOLID/Clean Code do projeto;
- Testes claros e diretos cobrindo os critérios de aceitação;
- Sem regressão em `pnpm test` e `npx tsc --noEmit`.

## Estrutura Técnica Esperada

```text
src/
  app/
    auth/
      login/
        page.tsx
      signup/
        page.tsx
  components/
    auth/
      SignInForm.tsx
      SignUpForm.tsx
  middleware.ts
```

Observação: nomes/caminhos podem seguir padrão existente do projeto, mantendo os objetivos da feature.

## Critérios de Aceitação

- [ ] Existe página de login contendo apenas formulário de login
- [ ] Existe página de cadastro contendo apenas formulário de criação de conta
- [ ] Usuário não autenticado não acessa `/`
- [ ] Usuário não autenticado não acessa `/dashboard`
- [ ] Usuário não autenticado é redirecionado para página de login
- [ ] Usuário autenticado acessa `/` e `/dashboard`
- [ ] Testes automatizados da feature passam
- [ ] `pnpm test` passa
- [ ] `npx tsc --noEmit` passa sem erros

## Restrições

- Não inventar requisitos além desta spec;
- Não alterar comportamento de autenticação que não esteja no escopo desta feature;
- Não alterar contratos públicos não relacionados sem atualizar spec/tasks.

## Definição de Pronto (DoD)

1. Página de login separada e funcional;
2. Página de cadastro separada e funcional;
3. Rotas `/` e `/dashboard` protegidas para usuário não autenticado;
4. Testes e type-check verdes.
