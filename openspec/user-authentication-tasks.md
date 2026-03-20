# Tasks: Cadastro e Login de Usuário com Email/Senha e Google

Spec de referência: `openspec/specs/user-authentication.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Base de Autenticação (NextAuth)

### T0 — Modelar tabela de usuários no banco

- [ ] Criar migration/schema para tabela de usuários
- [ ] Definir `id` como UUID com geração automática
- [ ] Definir campos obrigatórios: `email`, `nome`, `origemCadastro`
- [ ] Definir `senha` como opcional/nula para contas Google
- [ ] Definir `origemCadastro` como enum com valores `google` e `default`
- [ ] Criar índice único para `email`
- **Critério**: tabela de usuários criada com contrato exato da spec

### T1 — Criar setup de autenticação no App Router

- [ ] Criar `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Inicializar `NextAuth` com `authOptions`
- [ ] Exportar `handler as GET` e `handler as POST`
- [ ] Garantir configuração compatível com App Router
- **Critério**: endpoint de auth inicializa corretamente e responde nas rotas `/api/auth/*`

### T2 — Validar variáveis de ambiente obrigatórias da auth

- [ ] Ler `GOOGLE_CLIENT_ID` do ambiente
- [ ] Ler `GOOGLE_CLIENT_SECRETE` do ambiente
- [ ] Ler `NEXT_AUTH_SECRETE` do ambiente
- [ ] Falhar de forma explícita quando variáveis obrigatórias estiverem ausentes
- **Critério**: aplicação não inicia auth sem variáveis obrigatórias válidas

### T3 — Configurar providers do NextAuth

- [ ] Configurar `CredentialsProvider` para login com email/senha
- [ ] Configurar `GoogleProvider` com as credenciais do `.env`
- [ ] Definir callbacks/sessão necessários para o domínio atual
- **Critério**: providers de credenciais e Google ativos no NextAuth

---

## Fase 2 — Cadastro e Login por Email/Senha

### T4 — Implementar caso de uso de cadastro

- [ ] Criar serviço/caso de uso para registro de usuário por email/senha
- [ ] Validar formato de email e política mínima de senha
- [ ] Garantir unicidade de email
- [ ] Persistir senha com hash seguro
- [ ] Persistir `origemCadastro = default`
- **Critério**: usuário novo é criado com segurança e sem duplicidade

### T5 — Implementar autenticação por credenciais

- [ ] Integrar provider de credenciais com repositório/serviço de usuário
- [ ] Validar email/senha informados no login
- [ ] Restringir login por credenciais a usuários com `origemCadastro = default`
- [ ] Retornar sessão válida quando credenciais corretas
- [ ] Retornar erro amigável quando credenciais inválidas
- **Critério**: login por email/senha funcional de ponta a ponta

### T6 — Criar UI de cadastro e login por credenciais

- [ ] Criar formulário de cadastro com email/senha
- [ ] Criar formulário de login com email/senha
- [ ] Exibir erros de validação e autenticação de forma amigável
- [ ] Integrar formulários ao fluxo de auth existente
- **Critério**: usuário consegue cadastrar e logar via interface

---

## Fase 3 — Cadastro e Login com Google

### T7 — Implementar botão de autenticação Google

- [ ] Criar componente de botão “Continuar com Google”
- [ ] Exibir botão nas telas de cadastro e login
- [ ] Integrar ação do botão ao `signIn("google")`
- **Critério**: usuário inicia OAuth Google pela UI sem erro

### T8 — Tratar criação e vínculo de conta social

- [ ] No primeiro login Google, criar conta de usuário local
- [ ] Persistir usuário Google com `origemCadastro = google`
- [ ] Persistir `senha` como nula/ausente para usuário Google
- [ ] Em logins seguintes, reutilizar usuário vinculado
- [ ] Garantir consistência de sessão após callback
- **Critério**: cadastro/login social funciona de forma idempotente

---

## Fase 4 — Segurança, Testes e Validação

### T9 — Cobrir testes de autenticação

- [ ] Testar rota de auth com inicialização correta (`GET`/`POST`)
- [ ] Testar schema/migration da tabela de usuários
- [ ] Testar cadastro com email/senha (sucesso, duplicidade, inválido)
- [ ] Testar login com email/senha (sucesso/falha)
- [ ] Testar bloqueio de login por credenciais para usuário com origem `google`
- [ ] Testar fluxo de login Google com mocks adequados
- [ ] Testar criação Google com `senha` nula e `origemCadastro = google`
- [ ] Testar falha quando envs obrigatórios não estão definidos
- **Critério**: cobertura dos fluxos principais e de erro

### T10 — Validação final da feature

- [ ] Executar `pnpm test`
- [ ] Executar `npx tsc --noEmit`
- [ ] Validar manualmente cadastro/login com email/senha
- [ ] Validar manualmente login com Google
- **Critério**: feature pronta sem regressões

---

## Ordem de Execução Sugerida

```text
T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T0   | Média        |
| T1   | Baixa        |
| T2   | Baixa        |
| T3   | Média        |
| T4   | Média        |
| T5   | Média        |
| T6   | Média        |
| T7   | Baixa        |
| T8   | Média        |
| T9   | Média        |
| T10  | Baixa        |
