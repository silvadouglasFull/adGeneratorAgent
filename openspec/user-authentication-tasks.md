# Tasks: Cadastro e Login de Usuário com Email/Senha e Google

Spec de referência: `openspec/specs/user-authentication.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Base de Autenticação (NextAuth)

### T0 — Modelar tabela de usuários no banco

- [x] Criar migration/schema para tabela de usuários
- [x] Definir `id` como UUID com geração automática
- [x] Definir campos obrigatórios: `email`, `nome`, `origemCadastro`
- [x] Definir `senha` como opcional/nula para contas Google
- [x] Definir `origemCadastro` como enum com valores `google` e `default`
- [x] Criar índice único para `email`
- **Critério**: tabela de usuários criada com contrato exato da spec

### T1 — Criar setup de autenticação no App Router

- [x] Criar `src/app/api/auth/[...nextauth]/route.ts`
- [x] Inicializar `NextAuth` com `authOptions`
- [x] Exportar `handler as GET` e `handler as POST`
- [x] Garantir configuração compatível com App Router
- **Critério**: endpoint de auth inicializa corretamente e responde nas rotas `/api/auth/*`

### T2 — Validar variáveis de ambiente obrigatórias da auth

- [x] Ler `GOOGLE_CLIENT_ID` do ambiente
- [x] Ler `GOOGLE_CLIENT_SECRETE` do ambiente
- [x] Ler `NEXT_AUTH_SECRETE` do ambiente
- [x] Falhar de forma explícita quando variáveis obrigatórias estiverem ausentes
- **Critério**: aplicação não inicia auth sem variáveis obrigatórias válidas

### T3 — Configurar providers do NextAuth

- [x] Configurar `CredentialsProvider` para login com email/senha
- [x] Configurar `GoogleProvider` com as credenciais do `.env`
- [x] Definir callbacks/sessão necessários para o domínio atual
- **Critério**: providers de credenciais e Google ativos no NextAuth

### T3.1 — Proteger acesso da aplicação para usuários autenticados

- [x] Implementar proteção global para todas as páginas da aplicação, exceto `/auth`
- [x] Redirecionar usuário sem sessão para `/auth`
- [x] Manter `/api/auth/*` público para fluxo do NextAuth e cadastro
- [x] Garantir que usuário autenticado acesse normalmente as páginas protegidas
- **Critério**: nenhuma página da aplicação é acessível sem login, exceto `/auth`

---

## Fase 2 — Cadastro e Login por Email/Senha

### T4 — Implementar caso de uso de cadastro

- [x] Criar serviço/caso de uso para registro de usuário por email/senha
- [x] Criar schema Zod para payload de cadastro (email, senha, nome)
- [x] Aplicar validação Zod antes de chamar o caso de uso de cadastro
- [x] Validar formato de email e política mínima de senha
- [x] Garantir unicidade de email
- [x] Persistir senha com hash seguro
- [x] Persistir `origemCadastro = default`
- **Critério**: usuário novo é criado com segurança e sem duplicidade

### T5 — Implementar autenticação por credenciais

- [x] Integrar provider de credenciais com repositório/serviço de usuário
- [x] Validar email/senha informados no login
- [x] Restringir login por credenciais a usuários com `origemCadastro = default`
- [x] Retornar sessão válida quando credenciais corretas
- [x] Retornar erro amigável quando credenciais inválidas
- **Critério**: login por email/senha funcional de ponta a ponta

### T6 — Criar UI de cadastro e login por credenciais

- [x] Criar formulário de cadastro com email/senha
- [x] Criar formulário de login com email/senha
- [x] Exibir erros de validação e autenticação de forma amigável
- [x] Integrar formulários ao fluxo de auth existente
- **Critério**: usuário consegue cadastrar e logar via interface

---

## Fase 3 — Cadastro e Login com Google

### T7 — Implementar botão de autenticação Google

- [x] Criar componente de botão “Continuar com Google”
- [x] Exibir botão nas telas de cadastro e login
- [x] Integrar ação do botão ao `signIn("google")`
- **Critério**: usuário inicia OAuth Google pela UI sem erro

### T8 — Tratar criação e vínculo de conta social

- [x] No primeiro login Google, criar conta de usuário local
- [x] Persistir usuário Google com `origemCadastro = google`
- [x] Persistir `senha` como nula/ausente para usuário Google
- [x] Em logins seguintes, reutilizar usuário vinculado
- [x] Garantir consistência de sessão após callback
- **Critério**: cadastro/login social funciona de forma idempotente

---

## Fase 4 — Segurança, Testes e Validação

### T9 — Cobrir testes de autenticação

- [x] Testar rota de auth com inicialização correta (`GET`/`POST`)
- [ ] Testar schema/migration da tabela de usuários
- [x] Testar cadastro com email/senha (sucesso, duplicidade, inválido)
- [x] Testar erro de validação Zod para payload inválido no cadastro por credenciais
- [ ] Testar login com email/senha (sucesso/falha)
- [ ] Testar bloqueio de login por credenciais para usuário com origem `google`
- [ ] Testar fluxo de login Google com mocks adequados
- [ ] Testar criação Google com `senha` nula e `origemCadastro = google`
- [x] Testar falha quando envs obrigatórios não estão definidos
- [x] Testar bloqueio de acesso a páginas sem sessão
- [x] Testar redirecionamento para `/auth` quando usuário não autenticado
- [ ] Testar que `/auth` é acessível sem autenticação
- **Critério**: cobertura dos fluxos principais e de erro

### T10 — Validação final da feature

- [x] Executar `pnpm test`
- [x] Executar `npx tsc --noEmit`
- [ ] Validar manualmente cadastro/login com email/senha
- [ ] Validar manualmente login com Google
- [ ] Validar manualmente tentativa de acesso sem login para qualquer página (redireciona para `/auth`)
- **Critério**: feature pronta sem regressões

---

## Ordem de Execução Sugerida

```text
T0 → T1 → T2 → T3 → T3.1 → T4 → T5 → T6 → T7 → T8 → T9 → T10
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T0   | Média        |
| T1   | Baixa        |
| T2   | Baixa        |
| T3   | Média        |
| T3.1 | Média        |
| T4   | Média        |
| T5   | Média        |
| T6   | Média        |
| T7   | Baixa        |
| T8   | Média        |
| T9   | Média        |
| T10  | Baixa        |
