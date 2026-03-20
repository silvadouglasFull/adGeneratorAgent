# Tasks: User-Generated Prompts

Spec de referência: `openspec/specs/user-generated-prompts.md`

---

## Fase 1 — Setup e Infraestrutura

### T1 — Criar tabela `user_prompts` no schema

- [ ] Adicionar enum `pgEnum` em `src/tokenConsumption/infrastructure/db/schema.ts`:
  - Enum `promptTypeEnum` com valores `'text_generation', 'image_generation'`
- [ ] Adicionar tabela `userPromptsTable` com:
  - `id` (UUID, PK, auto-generated)
  - `userId` (UUID, FK para `usersTable`)
  - `type` (promptTypeEnum, NOT NULL)
  - `content` (TEXT, NOT NULL)
  - `isActive` (BOOLEAN, NOT NULL, default false)
  - `createdAt` (TIMESTAMP, default NOW)
  - `updatedAt` (TIMESTAMP, default NOW, auto-update)
  - Índices: `userId`, `type`, `isActive`, `(userId, type, isActive)` composto
  - **Constraint UNIQUE**: apenas 1 prompt ativo por userId + type (implementar com índice parcial: `WHERE is_active = true`)
- [ ] Exportar tipos `UserPrompt` e `NewUserPrompt` do schema
- **Critério**: Schema compila, constraint único implementado, tipos exportados

### T2 — Criar migration para `user_prompts`

- [ ] Rodar `pnpm drizzle-kit generate` para gerar migration
- [ ] Verificar SQL gerado em `drizzles/migrations/`
- [ ] Rodar `pnpm drizzle-kit migrate` para aplicar ao banco
- **Critério**: Tabela existe no Postgres, `\d user_prompts` mostra estrutura correta

### T3 — Instalar dependência `@uiw/react-md-editor`

- [ ] `pnpm add @uiw/react-md-editor`
- [ ] `pnpm add @uiw/react-markdown-preview` (para preview)
- **Critério**: Pacotes instalados e versionados no `pnpm-lock.yaml`

---

## Fase 2 — Domain e Application

### T4 — Criar enum `PromptType` (Domain)

- [ ] Criar arquivo `src/prompts/domain/enum/PromptType.ts`
- [ ] Definir enum TypeScript:
  ```typescript
  export enum PromptType {
    TEXT_GENERATION = "text_generation",
    IMAGE_GENERATION = "image_generation",
  }
  ```
- **Critério**: Enum exportado e reutilizável

### T5 — Criar entity `UserPrompt` (Domain)

- [ ] Criar arquivo `src/prompts/domain/entity/UserPrompt.ts`
- [ ] Definir classe:
  - Properties: `id`, `userId`, `type` (PromptType), `content`, `isActive`, `createdAt`, `updatedAt`
  - Métodos: constructor, getters, `setActive()`, `setInactive()`
  - Sem side-effects, apenas properties e métodos simples
- **Critério**: Classe TypeScript limpa, sem dependências externas

### T6 — Criar DTO `CreateUserPromptDTO` (Application)

- [ ] Criar arquivo `src/prompts/application/dto/CreateUserPromptDTO.ts`
- [ ] Definir interface com Zod validation:
  - `userId` (UUID string)
  - `type` (PromptType enum)
  - `content` (string, min 10 chars, max 10000 chars)
  - `isActive` (boolean, optional, default false)
- [ ] Exportar validator Zod: `createUserPromptSchema`
- **Critério**: Schema valida inputs, erros amigáveis, isActive defaulta para false

### T7 — Criar `PromptFetchService` (Domain)

- [ ] Criar arquivo `src/prompts/domain/service/PromptFetchService.ts`
- [ ] Implementar classe com método:
  - `async fetchActivePrompt(userId: string, type: PromptType): Promise<string>`
  - Busca em Redis com chave `user-prompt:{userId}:{type}`
  - Se não encontrar em Redis, tenta Postgres buscando prompt **ativo** do tipo
  - Se encontrar em Postgres (mas não em Redis), sincroniza para Redis
  - Se nenhum prompt ativo existir, lança `ActivePromptNotFoundError` com mensagem: `"Nenhum prompt ativo de tipo {type} encontrado para o usuário. Crie e ative um prompt."`
- [ ] Criar exceção `ActivePromptNotFoundError` customizada (herdar de base Error)
- **Critério**: Serviço busca apenas prompts ativos, erro específico

---

## Fase 3 — Infrastructure e Repository

### T8 — Criar interface `IUserPromptRepository`

- [ ] Criar arquivo `src/prompts/application/repository/IUserPromptRepository.ts`
- [ ] Definir interface com métodos:
  - `create(dto: CreateUserPromptDTO): Promise<UserPrompt>`
  - `findByUserIdAndType(userId: string, type: PromptType): Promise<UserPrompt | null>` (busca **ativo**)
  - `findActiveByUserIdAndType(userId: string, type: PromptType): Promise<UserPrompt | null>`
  - `findAllByUserId(userId: string): Promise<UserPrompt[]>` (todos, ativos e inativos)
  - `setActive(promptId: string): Promise<UserPrompt>` (ativa e desativa outros do mesmo tipo/usuário)
  - `setInactive(promptId: string): Promise<UserPrompt>`
  - `update(id: string, content: string): Promise<UserPrompt>` (manter status ativo/inativo)
  - `delete(id: string): Promise<void>`
- **Critério**: Interface clara com novos métodos de ativação

### T9 — Implementar `UserPromptPostgresRepository`

- [ ] Criar arquivo `src/prompts/infrastructure/postgres/UserPromptPostgresRepository.ts`
- [ ] Implementar interface:
  - `create()`: insere com `isActive = false` em Postgres (NÃO sincroniza Redis)
  - `findByUserIdAndType()`: query **ativo** do Postgres
  - `findActiveByUserIdAndType()`: alias ou mesmo comportamento
  - `findAllByUserId()`: query todos (ativos e inativos) com `createdAt DESC`
  - `setActive()`: transação que:
    - Desativa todos prompts do tipo/usuário (UPDATE isActive = false WHERE...)
    - Ativa o prompts especificado
    - Sincroniza novo ativo para Redis (fire-and-forget)
  - `setInactive()`: desativa prompt + remove Redis
  - `update()`: atualiza conteúdo, mantém status isActive
  - `delete()`: deleta + remove Redis se estava ativo
- [ ] Usar transações do Drizzle para operações críticas (setActive)
- **Critério**: Todas operações funcionam, constraint respeitada

### T10 — Criar serviço de sincronização Redis

- [ ] Criar arquivo `src/prompts/infrastructure/redis/PromptRedisSync.ts`
- [ ] Implementar funções:
  - `syncActivePromptToRedis(userId: string, type: PromptType, content: string)`
    - Salva em Redis com TTL de 24h
    - Fire-and-forget (não aguarda)
    - Log de erro se falhar
  - `removePromptFromRedis(userId: string, type: PromptType)`
    - Delete chave do Redis
    - Fire-and-forget
    - Log de erro se falhar
- [ ] **IMPORTANTE**: Apenas prompts ativos são sincronizados
- **Critério**: Sync funciona, apenas prompts ativos salvos em Redis

---

## Fase 4 — Route Handler

### T11 — Criar route handler POST `/api/prompts`

- [ ] Criar arquivo `src/app/api/prompts/route.ts`
- [ ] Método `POST`:
  - Valida sessão (401 se não autenticado)
  - Valida body com `createUserPromptSchema` (Zod)
  - Chama `repository.create()` (novo prompt sempre inativo por padrão)
  - Se `isActive = true` no request, chama `setActive()` após criação
  - Retorna 201 com prompt criado
  - Erros: 400 (validação), 401 (não autenticado), 500 (servidor)
- **Critério**: Endpoint funciona, novo prompt inativo por padrão

### T12 — Criar route handler GET `/api/prompts`

- [ ] Criar arquivo `src/app/api/prompts/route.ts` (mesmo arquivo, método GET)
- [ ] Método `GET`:
  - Valida sessão
  - Busca todos os prompts do usuário
  - Retorna 200 com array de prompts
  - Query param opcional `?type=text_generation` para filtrar
- **Critério**: Listagem funciona com/sem filtro

### T13 — Criar route handler PUT/DELETE/PATCH `/api/prompts/[id]`

- [ ] Criar arquivo `src/app/api/prompts/[id]/route.ts`
- [ ] Método `PUT`:
  - Valida sessão e ownership
  - Atualiza conteúdo mantendo status isActive
  - Retorna 200 com prompt atualizado
- [ ] Método `DELETE`:
  - Valida sessão e ownership
  - Deleta prompt
  - Retorna 204
- [ ] **Novo** Método `PATCH`:
  - Valida sessão e ownership
  - Body: `{ isActive: boolean }`
  - Se `isActive = true`: chama `setActive()` (desativa outros)
  - Se `isActive = false`: chama `setInactive()`
  - Retorna 200 com prompt atualizado
  - Validação: impedir desativar se é o único ativo do tipo
- **Critério**: Operações funcionam, PATCH permite ativar/desativar

---

## Fase 5 — UI e Componentes

### T14 — Criar componente `PromptEditor`

- [ ] Criar arquivo `src/app/prompts/PromptEditor.tsx`
- [ ] Props:
  - `type: PromptType` (select)
  - `initialContent?: string` (para edição)
  - `isActive?: boolean` (status inicial)
  - `onSave: (type, content, isActive) => Promise<void>`
- [ ] Componentes:
  - Select com opções de tipo (TEXT_GENERATION, IMAGE_GENERATION)
  - MDEditor com valor controlado
  - **Novo**: Radio ou Toggle para marcar como ativo
  - Botão "Salvar Prompt"
  - Loading state durante save
  - Toast/mensagem de sucesso/erro
  - Validação: se desativar, verificar se há outro ativo do tipo
- [ ] Usar `@uiw/react-md-editor` com CSS imports
- **Critério**: Componente renderiza, MDEditor edita, ativo/inativo funciona

### T15 — Criar componente `PromptsList`

- [ ] Criar arquivo `src/app/prompts/PromptsList.tsx`
- [ ] Props:
  - `prompts: UserPrompt[]`
  - `onDelete: (id: string) => Promise<void>`
  - `onEdit: (id: string) => void`
  - `onToggleActive: (id: string, isActive: boolean) => Promise<void>` (novo)
- [ ] Componentes:
  - Agrupar prompts por **tipo** (TEXT_GENERATION, IMAGE_GENERATION)
  - Para cada tipo, mostrar lista de prompts
  - **Badge/Highlight** indicando qual está **ativo** ("★ Ativo" ou destacado em cor)
  - Data de criação/atualização
  - Botões "Editar" e "Deletar"
  - **Novo**: Radio button ou toggle para ativar/desativar cada prompt
  - Validação ao clicar: impedir desativar se é o único ativo
  - Confirmar antes de deletar
  - Loading states para ações
- **Critério**: Lista renderiza agrupada, status ativo visível, ações funcionam

### T16 — Criar página `/app/prompts`

- [ ] Criar arquivo `src/app/prompts/page.tsx`
- [ ] Estrutura:
  - Verificar autenticação (redirect para `/auth` se não)
  - Título "Meus Prompts"
  - Instrução: "Crie quantos prompts quiser, mas apenas 1 por tipo estará ativo"
  - Form para criar novo (PromptEditor com isActive defaultando false)
  - Lista de prompts agrupados por tipo (PromptsList)
  - Loading state na carga inicial
- [ ] Fetch prompts ao mount via `GET /api/prompts`
- [ ] Handle criar/atualizar/deletar via endpoints
- [ ] Handle ativar/desativar via PATCH `/api/prompts/[id]`
- [ ] Gerenciar estado local com sucesso/erro das ações
- **Critério**: Página funciona end-to-end, autenticação validada, agrupamento por tipo

### T17 — Adicionar link na homepage

- [ ] Encontrar componente de navegação principal
- [ ] Adicionar link "Meus Prompts" que aponta para `/app/prompts`
- [ ] Mostrar apenas se `session.user` existir
- [ ] Estilizar conforme design existente
- **Critério**: Link aparece apenas para autenticados

---

## Fase 6 — Integração com Agente

### T18 — Melhorar `ImageIntentDetector`

- [ ] Abrir arquivo `src/agent/domain/service/ImageIntentDetector.ts`
- [ ] Estender lógica para também detectar intenção de texto
- [ ] Retornar enum com tipo(s):
  - `BOTH` se pedir texto E imagem
  - `TEXT_GENERATION` se só texto
  - `IMAGE_GENERATION` se só imagem
- [ ] Palavras-chave para texto: "texto", "anúncio", "descrição", "campanha"
- **Critério**: Detector retorna tipo correto

### T19 — Modificar `adGeneratorAgent.ts`

- [ ] Abrir arquivo `src/agent/adGeneratorAgent.ts`
- [ ] Adicionar parâmetro `sessionUserId` a `streamGeneratedAd()`:
  ```typescript
  export async function* streamGeneratedAd({
    input,
    model,
    sessionUserId, // novo
    heliconeRequestId,
  })
  ```
- [ ] No nó `generateAd`, antes de chamar o LLM:
  - Detectar intenção (se TEXT_GENERATION ou BOTH)
  - Se precisa texto, buscar prompt **ativo** via `PromptFetchService.fetchActivePrompt()`
  - Se não encontrar ativo, lança `ActivePromptNotFoundError` **antes** de chamar LLM
- [ ] Mesma lógica para `generateImage` (IMAGE_GENERATION)
- [ ] Se houver prompt ativo, usar em vez do prompt fixo
- [ ] Se nenhum tipo precisar de prompt, usar prompt fixo como fallback
- **Critério**: Agente busca apenas ativos, erro claro se não existir

### T20 — Criar testes do agente com prompts dinâmicos

- [ ] Criar arquivo `src/agent/__tests__/userGeneratedPrompts.test.ts`
- [ ] Testes:
  - ✅ Agente busca prompt **ativo** de texto quando usuário pede
  - ✅ Agente lança erro se prompt **ativo** não existir
  - ✅ Agente usa prompt ativo ao invés do fixo
  - ✅ Agente ignora prompts inativos (não usa)
  - ✅ ImageIntentDetector retorna BOTH corretamente
  - ✅ Constraint: apenas 1 ativo por tipo funciona
- [ ] Mock de `PromptFetchService`, `UserPromptRepository`, Redis
- **Critério**: Todos os testes passam, cobertura > 80%

---

## Fase 7 — Testes da UI

### T21 — Criar testes da tela `/app/prompts`

- [ ] Criar arquivo `src/app/prompts/__tests__/page.test.tsx`
- [ ] Testes:
  - ✅ Página redireciona para `/auth` se não autenticado
  - ✅ Página carrega prompts agrupados por tipo
  - ✅ Formulário de criação funciona
  - ✅ MDEditor edita conteúdo
  - ✅ Salvar novo prompt cria inativo por padrão
  - ✅ Ativar prompt via toggle funciona
  - ✅ Desativar prompt via toggle funciona
  - ✅ Deletar prompt remove
  - ✅ Lista exibe badge de ativo
  - ✅ Validação: não permite desativar único ativo
- [ ] Mock de `useSession`, `fetch`, endpoints
- **Critério**: Todos os testes passam

### T22 — Criar testes do PromptEditor

- [ ] Criar arquivo `src/app/prompts/__tests__/PromptEditor.test.tsx`
- [ ] Testes:
  - ✅ Select renderiza com opções corretas
  - ✅ MDEditor renderiza
  - ✅ onChange atualiza estado
  - ✅ onSave é chamado com dados + isActive
  - ✅ Loading state durante save
  - ✅ Toggle isActive pode ser ligado/desligado
  - ✅ Validação: campo content não vazio
- **Critério**: Todos os testes passam

---

## Fase 8 — Validação Final

### T23 — Rodar suite de testes

- [ ] `pnpm test` deve passar com 100% dos testes novos
- [ ] Coverage > 80% para novos arquivos
- [ ] Sem warnings
- **Critério**: Todos os testes verdes

### T24 — Validação de TypeScript

- [ ] `npx tsc --noEmit` deve passar sem erros
- [ ] Sem `any` types não justificados
- **Critério**: 0 erros, 0 warnings

### T25 — Teste manual end-to-end

- [ ] `pnpm dev`
- [ ] Autenticar com usuário
- [ ] Navegar para `/app/prompts`
- [ ] Criar 3 prompts TEXT_GENERATION
- [ ] Ativar primeiro prompt
- [ ] Verificar que apenas 1 está como ativo (badge mostrado)
- [ ] Tentar ativar segundo (primeiro deve desativar automaticamente)
- [ ] Criar prompt IMAGE_GENERATION
- [ ] Ativar prompt de imagem
- [ ] Verificar que pode ter 1 TEXT + 1 IMAGE ativos simultaneamente
- [ ] Ir para `/api/agent/generate`
- [ ] Enviar input pedindo anúncio (deve usar prompt TEXT ativo)
- [ ] Enviar input pedindo imagem (deve usar prompt IMAGE ativo)
- [ ] Desativar prompt de texto
- [ ] Tentar gerar anúncio (deve dar erro: "Nenhum prompt ativo...")
- [ ] Deletar alguns prompts
- [ ] Verificar que deleted não aparecem mais
- **Critério**: Fluxo completo funciona, constraint respeitada

---

## Ordem de Execução Sugerida

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 →
T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 →
T21 → T22 → T23 → T24 → T25
```

## Estimativa de Complexidade

| Fase | Tasks   | Complexidade                                |
| ---- | ------- | ------------------------------------------- |
| 1    | T1-T3   | Baixa                                       |
| 2    | T4-T7   | Média                                       |
| 3    | T8-T10  | **Média-Alta** (constraint UNIQUE complexa) |
| 4    | T11-T13 | Média                                       |
| 5    | T14-T17 | **Alta** (agrupamento, toggles, validações) |
| 6    | T18-T20 | **Alta** (apenas ativos, erro específico)   |
| 7    | T21-T22 | Média                                       |
| 8    | T23-T25 | Baixa                                       |

**Total estimado**: ~10-12 dias de desenvolvimento com 1 dev fulltime
_(+2 dias comparado a versão anterior por causa da constraint UNIQUE e lógica de ativação)_
