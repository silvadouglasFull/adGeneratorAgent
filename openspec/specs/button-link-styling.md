# Spec: Estilização de Botões e Links com Paleta de Cores

## O quê e porquê

Para garantir consistência visual em toda a aplicação, todos os botões e links devem seguir a paleta de cores centralizada em `src/flavor/flavor.ts`. Atualmente, os estilos de botão e link podem estar espalhados ou hardcoded, dificultando manutenção e consistência.

Esta funcionalidade vai:

- Estilizar todos os botões usando `--color-primary` como cor de fundo
- Implementar variações de botão (default, hover, active, disabled)
- Estilizar links com variações da cor primary (padrão, hover, visited)
- Centralizar todos os estilos de botão e link em `globals.css`
- Permitir reutilização consistente via classes CSS

## Visão geral

A solução utiliza CSS Variables já injetadas:

1. Criar estilos base para botões em `globals.css`
2. Criar estilos para links em `globals.css`
3. Implementar variações (primary, secondary, ghost, disabled)
4. Atualizar componentes React que usam `<button>` e `<a>` diretamente
5. Validar consistência visual em todas as páginas

## Detalhes técnicos

### Estilos de Botão

```css
/* Botão primary (padrão) */
.btn,
.btn-primary {
  background-color: var(--color-primary); /* #0ba5d5 */
  color: var(--color-background); /* #eef9f8 */
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn:hover,
.btn-primary:hover {
  background-color: var(--color-accent); /* #33cbe5 */
}

.btn:active,
.btn-primary:active {
  background-color: var(--color-secondary); /* #1d1d1c */
}

.btn:disabled {
  background-color: var(--color-border); /* #a2a2a2 */
  cursor: not-allowed;
  opacity: 0.6;
}

/* Botão secondary */
.btn-secondary {
  background-color: var(--color-secondary); /* #1d1d1c */
  color: var(--color-background); /* #eef9f8 */
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-text-light); /* #484848 */
}

/* Botão ghost (sem background) */
.btn-ghost {
  background-color: transparent;
  color: var(--color-primary); /* #0ba5d5 */
  border: 1px solid var(--color-primary);
}

.btn-ghost:hover {
  background-color: var(--color-accent); /* #33cbe5 */
  color: var(--color-background); /* #eef9f8 */
}
```

### Estilos de Link

```css
/* Link primary (padrão) */
a,
.link {
  color: var(--color-primary); /* #0ba5d5 */
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover,
.link:hover {
  color: var(--color-accent); /* #33cbe5 */
  text-decoration: underline;
}

a:visited,
.link:visited {
  color: var(--color-secondary); /* #1d1d1c */
}

/* Link secondary */
.link-secondary {
  color: var(--color-text-light); /* #484848 */
}

.link-secondary:hover {
  color: var(--color-primary); /* #0ba5d5 */
}

/* Link subtle */
.link-subtle {
  color: var(--color-text-light); /* #484848 */
  text-decoration: none;
}

.link-subtle:hover {
  color: var(--color-primary);
  text-decoration: underline;
}
```

## Critérios de Aceitação

- [x] Todos os `<button>` elementos aplicam classe `.btn` ou `.btn-*`
- [x] Todos os `<a>` elementos herdam estilos de link primary por padrão
- [x] Botões têm variações: primary, secondary, ghost
- [x] Botões têm estado hover e active com transições suaves
- [x] Botões têm estado disabled funcional
- [x] Links têm variações: primary, secondary, subtle
- [x] Links têm estados: padrão, hover, visited
- [x] Todos os estilos usam CSS Variables de `colorPalettes`
- [x] Nenhum valor de cor hardcoded em componentes
- [x] Componentes existentes atualizados para usar as classes
- [x] Testes visuais validam consistência em todas as páginas
- [x] `pnpm test` passa
- [x] `npx tsc --noEmit` passa sem erros

## Estrutura de arquivo

```
src/
  ├── app/
  │   └── globals.css       (updated: add button and link styles)
  └── components/
      ├── Button.tsx        (novo: componente Button reutilizável)
      └── Link.tsx          (novo: componente Link reutilizável)
```

Opcional criar componentes React para maior reusabilidade, mas mínimo é atualizar `globals.css`.

## Padrões aplicados

- **DDD**: Estilos são parte da camada de apresentação (flavor)
- **SOLID**:
  - **S**: Classes CSS focadas (`.btn`, `.btn-primary`, `.link`, etc)
  - **O**: Fácil adicionar novas variações sem modificar existentes
  - **D**: Componentes dependem de CSS Variables, não de valores hardcoded
- **Clean Code**: Nomes semânticos, transições suaves, consistência visual

## Variações suportadas

### Botões

- `.btn` / `.btn-primary` - Cor primary (padrão)
- `.btn-secondary` - Cor secundária
- `.btn-ghost` - Transparente com borda

### Links

- `a` / `.link` - Cor primary (padrão)
- `.link-secondary` - Cor text-light
- `.link-subtle` - Sem decoração por padrão

## Próximos passos (out of scope)

- Tamanhos variáveis de botão (sm, md, lg)
- Ícones em botões
- Estados de carregamento
- Animações suaves ao clicar
- Tooltip de help
