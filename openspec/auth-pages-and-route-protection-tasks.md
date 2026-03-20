# Tasks: Páginas Separadas de Login/Cadastro + Proteção de Rotas Home e Dashboard

Spec de referência: `openspec/specs/auth-pages-and-route-protection.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Páginas de Autenticação

### T1 — Criar página exclusiva de login

- [ ] Criar rota de página para login (ex.: `src/app/auth/login/page.tsx`)
- [ ] Renderizar apenas `SignInForm`
- [ ] Garantir que não há `SignUpForm` nessa página
- **Critério**: página de login contém somente formulário de login

### T2 — Criar página exclusiva de cadastro

- [ ] Criar rota de página para cadastro (ex.: `src/app/auth/signup/page.tsx`)
- [ ] Renderizar apenas `SignUpForm`
- [ ] Garantir que não há `SignInForm` nessa página
- **Critério**: página de cadastro contém somente formulário de criar conta

---

## Fase 2 — Proteção de Rotas

### T3 — Proteger `/` e `/dashboard` para não autenticados

- [ ] Ajustar middleware/guard para validar sessão nessas rotas
- [ ] Bloquear acesso sem sessão para `/`
- [ ] Bloquear acesso sem sessão para `/dashboard`
- [ ] Redirecionar sem sessão para rota de login
- **Critério**: não autenticado não acessa as rotas protegidas

### T4 — Preservar acesso de usuário autenticado

- [ ] Validar que usuário autenticado acessa `/`
- [ ] Validar que usuário autenticado acessa `/dashboard`
- [ ] Garantir ausência de regressão no fluxo existente
- **Critério**: autenticado acessa normalmente as páginas protegidas

---

## Fase 3 — Testes e Validação

### T5 — Testes automatizados da feature

- [ ] Testar renderização da página de login com apenas `SignInForm`
- [ ] Testar renderização da página de cadastro com apenas `SignUpForm`
- [ ] Testar redirecionamento de não autenticado para login ao acessar `/`
- [ ] Testar redirecionamento de não autenticado para login ao acessar `/dashboard`
- [ ] Testar acesso permitido para usuário autenticado
- **Critério**: cobertura dos fluxos principais da feature

### T6 — Validação final

- [ ] Executar `pnpm test`
- [ ] Executar `npx tsc --noEmit`
- [ ] Validar manualmente navegação sem login em `/` e `/dashboard`
- [ ] Validar manualmente login e acesso normal às rotas protegidas
- **Critério**: feature pronta sem regressões

---

## Ordem de Execução Sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T1   | Baixa        |
| T2   | Baixa        |
| T3   | Média        |
| T4   | Baixa        |
| T5   | Média        |
| T6   | Baixa        |
