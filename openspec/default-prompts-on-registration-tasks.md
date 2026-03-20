# Tasks: Criação de Prompts Padrão no Cadastro de Usuário

Spec de referência: `openspec/specs/default-prompts-on-registration.md`

---

## Fase 1 — Conteúdo Padrão

### T1 — Criar constantes de conteúdo padrão

- [x] Criar `src/prompts/domain/seed/defaultPromptContents.ts`
- [x] Exportar `DEFAULT_TEXT_GENERATION_PROMPT`: string com o conteúdo da constante `instructions` de `src/agent/prompt.ts` (sem dependência de import do módulo do agente — copiar o conteúdo como string literal)
- [x] Exportar `DEFAULT_IMAGE_GENERATION_PROMPT`: string com o conteúdo do system message de `src/agent/imagePrompt.ts` (sem dependência de import do módulo do agente — copiar o conteúdo como string literal)
- [x] Sem imports de framework ou módulos externos
- **Critério**: arquivo compila sem erros e exporta duas strings não-vazias ✅

---

## Fase 2 — Serviço de Domínio

### T2 — Criar `DefaultPromptSeeder`

- [x] Criar `src/prompts/domain/service/DefaultPromptSeeder.ts`
- [x] Classe com construtor recebendo `IUserPromptRepository`
- [x] Método `seedForUser(userId: string): Promise<void>`:
  - Para `TEXT_GENERATION`:
    1. Chamar `repository.findByUserIdAndType(userId, PromptType.TEXT_GENERATION)`
    2. Se `null`: chamar `repository.create({ userId, type: PromptType.TEXT_GENERATION, content: DEFAULT_TEXT_GENERATION_PROMPT, isActive: true })`
    3. Se existir: não fazer nada
  - Repetir para `IMAGE_GENERATION` com `DEFAULT_IMAGE_GENERATION_PROMPT`
- [x] Sem dependência de Redis
- [x] Sem `any`
- **Critério**: classe criada, compila sem erros ✅

### T3 — Testes unitários do `DefaultPromptSeeder`

- [x] Criar `src/prompts/domain/service/__tests__/DefaultPromptSeeder.test.ts`
- [x] Mock de `IUserPromptRepository`
- [x] Cenário 1: usuário sem prompts → `create` chamado duas vezes (uma por tipo)
- [x] Cenário 2: usuário com `TEXT_GENERATION` existente → `create` chamado apenas para `IMAGE_GENERATION`
- [x] Cenário 3: usuário com ambos os tipos → `create` não chamado nenhuma vez
- [x] Cenário 4: `repository.create` lança erro → erro propagado (quem chama é responsável pelo `.catch()`)
- **Critério**: 4 testes passando ✅

---

## Fase 3 — Container

### T4 — Registrar `DefaultPromptSeeder` no `promptsContainer`

- [x] Em `src/prompts/promptsContainer.ts`:
  - [x] Importar `DefaultPromptSeeder`
  - [x] Instanciar: `const defaultPromptSeeder = new DefaultPromptSeeder(userPromptRepository)`
  - [x] Exportar no objeto `promptsContainer`
- **Critério**: `promptsContainer.defaultPromptSeeder` disponível sem erros de tipo ✅

---

## Fase 4 — Hook no Registro via Credenciais

### T5 — Disparar seeder no `POST /api/auth/register`

- [x] Em `src/app/api/auth/register/route.ts`:
  - [x] Importar `promptsContainer`
  - [x] Após `return Response.json({ ... }, { status: 201 })`: disparar fire-and-forget com `.catch()`
  - [x] **Sem `await`** — fire-and-forget
- **Critério**: rota retorna `201` sem aguardar o seeder; TypeScript compila ✅

### T6 — Atualizar testes do `POST /api/auth/register`

- [x] Em `src/app/api/auth/register/__tests__/route.test.ts`:
  - [x] Adicionar mock de `@/prompts/promptsContainer`
  - [x] Adicionar teste: após `201`, `seedForUser` foi chamado com o `id` do usuário criado
  - [x] Garantir que os testes existentes continuam passando
- **Critério**: todos os testes da rota passam ✅

---

## Fase 5 — Hook no Registro via Google

### T7 — Disparar seeder no callback `signIn` do Google

- [x] Em `src/auth/infrastructure/auth/authOptions.ts`, no callback `signIn` (bloco `account?.provider === "google"`):
  - [x] Capturar o retorno de `upsertGoogleUser`
  - [x] Disparar seeder fire-and-forget com `.catch()`
  - [x] Importar `promptsContainer` no topo do arquivo
  - [x] **Sem `await`** no seeder
  - [x] Retornar `true` sem esperar o seeder
- **Critério**: callback retorna `true` sem aguardar o seeder; TypeScript compila ✅

---

## Fase 6 — Validação

### T8 — TypeScript

- [x] Executar `npx tsc --noEmit`
- [x] Resultado: 0 erros
- **Critério**: compilação limpa ✅

### T9 — Testes completos

- [x] Executar `pnpm test`
- [x] Todas as suites passando (incluindo as novas) — 49 suites, 240 testes
- **Critério**: 0 falhas ✅

---

## Ordem de Execução

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T1   | Baixa        |
| T2   | Baixa        |
| T3   | Média        |
| T4   | Baixa        |
| T5   | Baixa        |
| T6   | Média        |
| T7   | Baixa        |
| T8   | Baixa        |
| T9   | Baixa        |
