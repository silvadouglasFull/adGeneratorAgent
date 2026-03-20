# Tasks: Implementação de Paletas de Cores Dinâmicas

**Status**: Não iniciado  
**Spec**: [dynamic-color-palettes.md](specs/dynamic-color-palettes.md)  
**Critério de aceitação**: Todos os checkboxes abaixo devem passar

## Epic: Centralizar e injetar paletas de cores dinamicamente

### 1. Estender `flavor.ts` com colorPalettes

**Objetivo**: Adicionar constante `colorPalettes` com cores do flavor

- [ ] Adicionar constante `colorPalettes` em `src/flavor/flavor.ts`:
  ```typescript
  export const colorPalettes = {
    primary: "#3B82F6",
    secondary: "#1F2937",
    accent: "#F59E0B",
    text: "#000000",
    textLight: "#6B7280",
    border: "#E5E7EB",
    background: "#FFFFFF",
  } as const;
  ```
- [ ] Adicionar JSDoc comentários explicando cada cor semântica
- [ ] Exportar função `getCSSVariablesFromPalette(): string`
  - Pega valores de `colorPalettes`
  - Retorna CSS string bem formado: `:root { --color-primary: ...; }`
  - Sem `any`, TypeScript strict
- [ ] Testes unitários em `src/flavor/__tests__/flavor.test.ts`
  - Testa `getCSSVariablesFromPalette()` retorna string válida
  - Testa que todas as 7 variáveis CSS estão presentes
  - Testa que nenhuma cor fica `undefined`

**Checklist técnico**:

```
- [ ] Sem eslint/TypeScript errors
- [ ] `pnpm test -- flavor.test.ts` passa
```

---

### 2. Integrar injeção de CSS Variables no `RootLayout`

**Objetivo**: Injetar as cores como CSS Variables ao renderizar

- [ ] Abrir `src/app/layout.tsx`
- [ ] Importar `getCSSVariablesFromPalette` de `@/flavor/flavor`
- [ ] Criar `<style>` tag no `<head>` com conteúdo de `getCSSVariablesFromPalette()`
  - Pode ser feito direto no JSX ou via effect
  - O importante: CSS Variables disponível antes de renderizar children
- [ ] Sem quebra de SSR ou funcionalidade existente
- [ ] Testes básicos confirmam injeção funciona

**Checklist técnico**:

```
- [ ] `pnpm dev` roda sem warnings/errors
- [ ] `pnpm build` passa
- [ ] Browser DevTools mostra `<style>` tag injetada no `<head>`
```

---

### 3. Atualizar `globals.css` para usar CSS Variables

**Objetivo**: Refatorar CSS global para usar variáveis dinâmicas

- [ ] Abrir `src/app/globals.css`
- [ ] Identificar cores hardcoded (ex: `color: #000000`, `border: 1px solid #E5E7EB`)
- [ ] Substituir por CSS Variables (ex: `color: var(--color-text)`, `border: 1px solid var(--color-border)`)
- [ ] Exemplos:

  ```css
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-primary);
  }

  body {
    color: var(--color-text);
    background-color: var(--color-background);
  }

  button {
    border: 1px solid var(--color-border);
  }

  .secondary-text {
    color: var(--color-text-light);
  }
  ```

- [ ] Validar que visualmente nada quebra
- [ ] Adicionar comentário no início do arquivo: `/* Cores carregadas dinamicamente via flavor.ts CSS Variables */`

**Checklist técnico**:

```
- [ ] Sem CSS parse errors
- [ ] `pnpm dev` renderiza corretamente na Home
- [ ] Browser DevTools confirma `--color-*` variáveis estão resolvidas
```

---

### 4. Testes básicos de funcionalidade

**Objetivo**: Validar que cores dinâmicas funcionam end-to-end

- [ ] Teste visual simples:
  - Abrir `pnpm dev`
  - Navegar para home page
  - Inspecionar elemento (F12) → Colors estão com valores de `colorPalettes`
  - Não deve haver `var(--color-*) is undefined` ou similar
- [ ] Teste de mudança (opcional para MVP):
  - Editar uma cor em `colorPalettes`
  - Salvar arquivo
  - Verificar Fast Refresh aplica a mudança automaticamente

**Checklist técnico**:

```
- [ ] `pnpm test` passa todos os testes
- [ ] Nenhuma cor fica sem resolver no navegador
```

---

### 5. Documentação

**Objetivo**: Facilitar futuro uso e customização

- [ ] Adicionar comentários JSDoc em `flavor.ts`:
  - Explicar o que é cada cor semântica
  - Como adicionar uma nova cor (ex: `danger: string`)
  - Exemplo de uso nas variáveis CSS

- [ ] Mencionar na documentação existente (se houver README em `src/flavor/`) ou em comentário de bloco:
  > "To customize colors for a different flavor:
  >
  > 1. Update `colorPalettes` values in `src/flavor/flavor.ts`
  > 2. No other changes needed - CSS Variables load automatically"

**Checklist técnico**:

```
- [ ] `npx tsc --noEmit` sem erros
- [ ] `pnpm lint` sem warnings em flavor.ts
```

---

## Critério de Aceitação Final

✅ `colorPalettes` definida como objeto simples em `flavor.ts`  
✅ `getCSSVariablesFromPalette()` exportada  
✅ CSS Variables injetadas no `RootLayout`  
✅ `globals.css` usa `var(--color-*)` ao invés de cores hardcoded  
✅ Todos os testes passam: `pnpm test`  
✅ Build bem-sucedido: `pnpm build`  
✅ TypeScript sem erros: `npx tsc --noEmit`  
✅ Nenhum `any` não justificado  
✅ Cores renderizam corretamente no navegador

## Estimativa

- Task 1: 20min
- Task 2: 15min
- Task 3: 15min
- Task 4: 10min
- Task 5: 10min
- **Total**: ~70min (1h10min)
