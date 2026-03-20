# Tasks: Estilização de Botões e Links com Paleta de Cores

**Status**: Não iniciado  
**Spec**: [button-link-styling.md](specs/button-link-styling.md)  
**Critério de aceitação**: Todos os checkboxes abaixo devem passar

## Epic: Estilizar botões e links com paleta de cores centralizada

### 1. Adicionar estilos base de botão em `globals.css`

**Objetivo**: Definir classes de botão que usam CSS Variables

- [ ] Adicionar estilo `.btn` (botão primary padrão)
  - Background: `var(--color-primary)` (#0ba5d5)
  - Text: `var(--color-background)` (#eef9f8)
  - Padding: `0.75rem 1.5rem`
  - Border-radius: `0.375rem`
  - Cursor: `pointer`
  - Transição suave em hover/active (0.2s ease)

- [ ] Adicionar variação `.btn-primary` (alias para `.btn`)
- [ ] Adicionar variação `.btn-secondary`
  - Background: `var(--color-secondary)` (#1d1d1c)
  - Borda: `1px solid var(--color-border)`

- [ ] Adicionar variação `.btn-ghost`
  - Background: `transparent`
  - Color: `var(--color-primary)`
  - Borda: `1px solid var(--color-primary)`

- [ ] Adicionar estados interativos
  - `:hover` muda para `var(--color-accent)` (#33cbe5)
  - `:active` muda para `var(--color-secondary)` ou escurece
  - `:disabled` muda para `var(--color-border)` com opacidade 0.6

**Checklist técnico**:

```
- [ ] Sem CSS parse errors
- [ ] Todos os botões usan CSS Variables
- [ ] Sem valores hardcoded de cor
```

---

### 2. Adicionar estilos base de link em `globals.css`

**Objetivo**: Definir classes de link que seguem paleta

- [ ] Adicionar estilo padrão para `a` tag
  - Color: `var(--color-primary)` (#0ba5d5)
  - Text-decoration: `none`
  - Transição suave (0.2s ease)

- [ ] Adicionar estado `:hover`
  - Color: `var(--color-accent)` (#33cbe5)
  - Text-decoration: `underline`

- [ ] Adicionar estado `:visited`
  - Color: `var(--color-secondary)` (#1d1d1c)

- [ ] Adicionar classe `.link` (alias do `a`)

- [ ] Adicionar classe `.link-secondary`
  - Color: `var(--color-text-light)` (#484848)
  - Hover: volta para `var(--color-primary)`

- [ ] Adicionar classe `.link-subtle`
  - Color: `var(--color-text-light)`
  - Sem text-decoration por padrão
  - Hover: underline + `var(--color-primary)`

**Checklist técnico**:

```
- [ ] Sem CSS parse errors
- [ ] Transições suaves
- [ ] Sem valores hardcoded
```

---

### 3. Atualizar componentes para usar as classes

**Objetivo**: Garantir que todos os botões e links usem as classes CSS

- [ ] Verificar componentes que contêm `<button>` direto
  - Exemplos prováveis: `src/components/`, `src/app/page.tsx`
  - Adicionar classe `.btn` ou `.btn-*` conforme variação
- [ ] Verificar componentes que contêm `<a>` direto
  - Links devem herdar estilo automático ou ter classe `.link`
- [ ] Não adicionar estilos inline, apenas usar classes CSS

- [ ] Testar visualmente cada componente com as novas classes

**Checklist técnico**:

```
- [ ] Nenhum <button> sem classe
- [ ] Nenhum estilo inline style={{ color: ... }}
- [ ] `pnpm dev` renderiza corretamente
```

---

### 4. Testes visuais e validação

**Objetivo**: Validar que os estilos funcionam em todas as páginas

- [ ] Testes visuais (manual):
  - Abrir `pnpm dev`
  - Navegar para cada página
  - Inspecionar botões e links (F12)
  - Confirmar que cores vêm de CSS Variables
  - Testar hover e active states
- [ ] Testes de contraste (acessibilidade):
  - Botão primary (#0ba5d5) sobre background (#eef9f8) tem contraste suficiente?
  - Link primary (#0ba5d5) é legível?
  - Links visitados (#1d1d1c) são distinguíveis?

- [ ] Teste de responsividade:
  - Botões ficam bons em mobile?
  - Links não quebram em tamanhos menores?

**Checklist técnico**:

```
- [ ] `pnpm build` passa
- [ ] Browser DevTools mostra CSS Variables resolvidas
- [ ] Nenhum "undefined" ou erro no console
```

---

### 5. Documentação

**Objetivo**: Facilitar futuro uso das classes de botão e link

- [ ] Adicionar comentário em `globals.css` explicando:

  ```css
  /* Button Classes
     .btn, .btn-primary    - Primary button (default)
     .btn-secondary        - Secondary button
     .btn-ghost           - Transparent button with border
     
     All buttons support :hover, :active, :disabled states
  */
  ```

- [ ] Adicionar comentário para links:

  ```css
  /* Link Classes
     a, .link              - Primary link (default)
     .link-secondary       - Secondary link
     .link-subtle         - Subtle link without underline
  */
  ```

- [ ] Documentar em `src/flavor/` README ou comentário:
  - Como usar as classes de botão
  - Como usar as classes de link
  - Exemplos de variações

**Checklist técnico**:

```
- [ ] `npx tsc --noEmit` sem erros
- [ ] `pnpm lint` sem warnings em globals.css
```

---

## Critério de Aceitação Final

✅ Todos os botões aplicam `.btn` ou variações  
✅ Todos os links herdam ou têm classe `.link`  
✅ Estados (hover, active, disabled) funcionam  
✅ Cores vêm de CSS Variables, nenhuma hardcoded  
✅ Transições suaves com `transition: 0.2s ease`  
✅ Testes visuais confirmam consistência  
✅ Build bem-sucedido: `pnpm build`  
✅ TypeScript sem erros: `npx tsc --noEmit`  
✅ Lint sem problemas: `pnpm lint src/app/globals.css`  
✅ Documentação clara

## Estimativa

- Task 1: 20min
- Task 2: 15min
- Task 3: 20min
- Task 4: 15min
- Task 5: 10min
- **Total**: ~80min (1h20min)
