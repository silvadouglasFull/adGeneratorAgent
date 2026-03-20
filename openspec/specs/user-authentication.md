# Spec: Cadastro e Login de Usuário com Email/Senha e Google

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Implementar autenticação de usuário com duas formas de acesso:

1. Cadastro e login por email e senha;
2. Cadastro e login por conta Google.

A inicialização deve seguir a documentação oficial do NextAuth para App Router (`Route Handlers`), com `NextAuth` inicializado em `app/api/auth/[...nextauth]/route.ts` e exportação de `GET` e `POST`.

## Referência de Documentação

- NextAuth Initialization: https://next-auth.js.org/configuration/initialization

Pontos aplicados desta referência:

- Em App Router, usar `Route Handlers` como forma preferencial de inicialização;
- Definir handler com `const handler = NextAuth({...})`;
- Exportar `handler as GET` e `handler as POST`;
- Não usar runtime edge para inicialização do NextAuth.

## Objetivo da Feature

- Permitir criação de conta e autenticação com credenciais (email/senha);
- Permitir autenticação com Google via botão de OAuth;
- Centralizar o fluxo de autenticação no NextAuth;
- Persistir dados de credenciais e perfil mínimo no banco de dados;
- Ler credenciais sensíveis exclusivamente do `.env`.

## Escopo

### Incluído

- Configuração do NextAuth em rota catch-all de autenticação;
- Provider de credenciais para email/senha;
- Provider Google para login/cadastro social;
- Persistência de usuários em tabela dedicada no banco de dados;
- Botões de UI para cadastro/login com Google;
- Formulários para cadastro/login com email/senha;
- Uso dos envs obrigatórios:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRETE`
  - `NEXT_AUTH_SECRETE`
- Testes automatizados do fluxo principal.

### Não incluído

- Recuperação de senha por email;
- Verificação de email;
- MFA/2FA;
- Gestão avançada de papéis/permissões;
- Login com outros provedores sociais.

## Requisitos Funcionais

### RF1 — Inicialização do NextAuth

- Criar rota `app/api/auth/[...nextauth]/route.ts`;
- Inicializar com `NextAuth(authOptions)`;
- Exportar `GET` e `POST` a partir do mesmo handler;
- Configuração deve incluir providers de credenciais e Google.

### RF2 — Cadastro com Email/Senha

- Permitir criação de usuário com email e senha válidos;
- Validar payload de cadastro com biblioteca Zod antes de processar a criação;
- Persistir senha de forma segura (hash, nunca texto plano);
- Persistir `origemCadastro` como `default`;
- Impedir cadastro duplicado para o mesmo email;
- Retornar erro amigável para dados inválidos.

### RF3 — Login com Email/Senha

- Permitir autenticação por email/senha via provider de credenciais;
- Retornar erro de autenticação para credenciais inválidas;
- Criar sessão válida após autenticação bem-sucedida.

### RF4 — Login/Cadastro com Google

- Expor botão de “Continuar com Google” nas telas de autenticação;
- Configurar provider Google usando envs do projeto;
- No primeiro acesso Google, criar conta de usuário com `origemCadastro` igual a `google`;
- Em acessos seguintes, autenticar usuário existente.

### RF7 — Persistência obrigatória em banco de dados

- O cadastro/login deve persistir e consultar dados na tabela de usuários;
- A tabela deve possuir `id` UUID com geração automática;
- A tabela deve armazenar:
  - `email`;
  - `senha` (obrigatória para cadastro por credenciais; ausente/nula para cadastro Google);
  - `nome` do usuário;
  - `origemCadastro` como enum com valores: `google` e `default`;
- `email` deve ser único.

### RF5 — Uso obrigatório das variáveis de ambiente

- Ler `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRETE` e `NEXT_AUTH_SECRETE` do `.env`;
- Bloquear inicialização da auth se alguma variável obrigatória estiver ausente;
- Não hardcodar segredos no código.

### RF6 — Sessão e segurança mínima

- Sessão deve ser criada e validada pelo NextAuth;
- Endpoints protegidos devem negar acesso sem sessão válida;
- Erros de autenticação não devem vazar dados sensíveis.

## Requisitos Não Funcionais

- Implementação em TypeScript, sem `any` não justificado;
- Código organizado conforme DDD/SOLID/Clean Code;
- Separação de domínio, aplicação e infraestrutura quando aplicável;
- Validação de entrada de cadastro por credenciais com Zod e erros claros de validação;
- Testes claros e diretos cobrindo os critérios de aceitação;
- Não introduzir regressões nas rotas existentes.

## Estrutura Técnica Esperada

```text
src/
  app/
    api/
      auth/
        [...nextauth]/
          route.ts
  domain/
    user/
  application/
    auth/
  infrastructure/
    auth/
  components/
    auth/
      SignInForm.tsx
      SignUpForm.tsx
      GoogleAuthButton.tsx

  infrastructure/
    persistence/
      user/
        user.schema.ts
        user.repository.ts
```

Observação: os caminhos exatos podem seguir a estrutura vigente do repositório, mantendo os objetivos desta spec.

## Contrato de Persistência (Tabela de Usuários)

Modelo esperado da tabela de usuários:

- `id`: UUID, chave primária, geração automática;
- `email`: string, obrigatório, único;
- `senha`: string, opcional/nula para usuários Google;
- `nome`: string, obrigatório;
- `origemCadastro`: enum obrigatório com valores `google` | `default`.

Regras:

- Usuário criado por email/senha deve ter `origemCadastro = default` e `senha` preenchida com hash;
- Usuário criado por Google deve ter `origemCadastro = google` e `senha` nula/ausente;
- Login por credenciais só pode autenticar usuários com `origemCadastro = default` e `senha` válida.

## Contrato de Configuração (Env)

Variáveis obrigatórias:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRETE=
NEXT_AUTH_SECRETE=
```

## Critérios de Aceitação

- [ ] Existe `app/api/auth/[...nextauth]/route.ts` com `NextAuth` inicializado no padrão App Router
- [ ] O handler exporta `GET` e `POST`
- [ ] Usuário consegue cadastrar com email/senha
- [ ] Payload de cadastro por email/senha é validado com Zod
- [ ] Usuário consegue logar com email/senha
- [ ] Existe botão de autenticação com Google nas telas de auth
- [ ] Usuário consegue autenticar com Google com as credenciais vindas do `.env`
- [ ] Cadastro/login social cria e reutiliza usuário corretamente
- [ ] A aplicação falha de forma explícita quando faltar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRETE` ou `NEXT_AUTH_SECRETE`
- [ ] Senha é persistida com hash seguro
- [ ] Existe tabela de usuários com `id` UUID automático
- [ ] A tabela armazena `email`, `senha`, `nome` e `origemCadastro` (enum `google` | `default`)
- [ ] `senha` é opcional para usuários Google e obrigatória para usuários de credenciais
- [ ] Erros de validação Zod retornam resposta amigável e consistente
- [ ] Testes automatizados cobrindo fluxos principais passam
- [ ] `pnpm test` passa
- [ ] `npx tsc --noEmit` passa sem erros

## Restrições

- Não inventar requisitos além desta spec;
- Não alterar contratos públicos não relacionados sem atualização da spec;
- Não implementar comportamento diferente do descrito para cadastro/login.

## Definição de Pronto (DoD)

1. Fluxo de cadastro por email/senha funcional;
2. Fluxo de login por email/senha funcional;
3. Fluxo de autenticação por Google funcional;
4. Persistência de usuário no banco com contrato da tabela atendido;
5. Variáveis de ambiente obrigatórias validadas;
6. Testes e type-check verdes.
