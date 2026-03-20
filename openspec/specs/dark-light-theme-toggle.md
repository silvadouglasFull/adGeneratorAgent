# Spec: Sistema de Tema Dark/Light Dinâmico

## O quê e porquê

Para melhorar a experiência do usuário e acessibilidade, a aplicação deve suportar temas dark e light. Com base no arquivo `flavor.ts`, quando a paleta `darkColors` estiver definida, o sistema deve permitir trocar entre temas. Se apenas `lightColors` existir, a funcionalidade de toggle não é disponibilizada.

Esta funcionalidade vai:

- Validar disponibilidade de ambas as paletas (dark e light) em `flavor.ts`
- Carregar dinamicamente a paleta apropriada baseada na preferência do usuário
- Persistir a escolha em `localStorage`
- Injetar CSS Variables corretas no documento
- Renderizar botão de toggle apenas se ambas as paletas existirem
- Fornecer componente isolado `ThemeToggle` para qualquer página/componente

## Visão geral

A solução utiliza:

1. Função para validar e carregar paletas de `flavor.ts`
2. Context/Hook React para gerenciar estado do tema
3. Persistência em `localStorage` (`theme: 'light' | 'dark'`)
4. Componente `ThemeToggle` isolado e reutilizável
5. Injeção dinâmica de CSS Variables conforme tema

## Detalhes técnicos

### Validação de Paletas

```typescript
type ThemeType = 'light' | 'dark'

interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  text: string
  textLight: string
  border: string
  background: string
}

export interface ThemeConfig {
  lightColors: ColorPalette
  darkColors?: ColorPalette
}

// Em flavor.ts:
export const colorPalettes: ThemeConfig = {
  lightColors: { ... },
  darkColors: { ... }  // opcional
}

// Função de validação
export function isThemeToggleAvailable(): boolean {
  return !!colorPalettes.darkColors
}

export function getCurrentThemePalette(theme: ThemeType): ColorPalette {
  if (theme === 'dark' && colorPalettes.darkColors) {
    return colorPalettes.darkColors
  }
  return colorPalettes.lightColors
}
```

### Hook useTheme

```typescript
// src/hooks/useTheme.ts
export function useTheme(): {
  theme: "light" | "dark";
  toggleTheme: () => void;
  isAvailable: boolean;
} {
  // Lê do localStorage ou usa 'light' como padrão
  // Fornece toggleTheme para mudar
  // isAvailable indica se darkColors existe
}
```

### Componente ThemeToggle

```typescript
// src/components/ThemeToggle.tsx
export function ThemeToggle(): JSX.Element | null {
  const { theme, toggleTheme, isAvailable } = useTheme()

  // Se darkColors não existe, retorna null
  if (!isAvailable) return null

  // Botão isolado que pode ser importado de qualquer lugar
  return (
    <button className="btn-ghost" onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
```

### CSS Variables Dinâmicas

As CSS Variables mudam conforme o tema ativo:

**Light Theme (padrão)**:

```css
--color-primary: #0ba5d5 --color-secondary: #1d1d1c --color-accent: #33cbe5
  --color-text: #1d1d1c --color-text-light: #484848 --color-border: #a2a2a2
  --color-background: #eef9f8;
```

**Dark Theme** (se disponível):

```css
--color-primary: #111313 --color-secondary: #1f1f1e --color-accent: #69d9ec
  --color-text: #5e5e5b --color-textLight: #c7c7c7 --color-border: #121212
  --color-background: #111313;
```

## Critérios de Aceitação

- [x] Função `isThemeToggleAvailable()` valida se `darkColors` existe
- [x] Função `getCurrentThemePalette(theme)` retorna paleta correta
- [x] `useTheme()` Hook gerencia estado do tema
- [x] Tema carregado do `localStorage` com fallback `light`
- [x] CSS Variables injetadas conforme tema ativo
- [x] Componente `ThemeToggle` isolado e reutilizável
- [x] `ThemeToggle` retorna `null` se apenas light colors existe
- [x] Botão integrado no layout (ex: header/navbar)
- [x] Toggle funciona in-browser sem refresh
- [x] Preferência persiste entre sessões
- [x] TypeScript strict: sem `any` não justificado
- [x] `pnpm test` passa
- [x] `npx tsc --noEmit` passa sem erros

## Estrutura de arquivo

```
src/
  ├── flavor/
  │   └── flavor.ts              (updated: adicionar type ThemeConfig, isThemeToggleAvailable)
  ├── hooks/
  │   └── useTheme.ts            (novo)
  ├── components/
  │   └── ThemeToggle.tsx        (novo)
  ├── app/
  │   ├── layout.tsx             (updated: integrar ThemeToggle, injetar CSS Variables)
  │   └── globals.css            (sem mudanças - variables já existem)
  └── context/
      └── ThemeContext.tsx       (novo - opcional, se usar Context em vez de Hook puro)
```

## Padrões aplicados

- **DDD**: Tema é parte do domínio visual/flavor
- **SOLID**:
  - **S**: Funções específicas (validação, carregamento, toggle)
  - **O**: Fácil adicionar novos temas sem modificar código
  - **D**: Componentes dependem de Hook, não de implementação
- **Clean Code**: Nomes semânticos, sem `any`, tipagem forte

## Como customizar

Para adicionar um novo tema no futuro:

1. Adicionar nova paleta em `flavor.ts`:

   ```typescript
   export const colorPalettes = {
     lightColors: { ... },
     darkColors: { ... },
     customColors: { ... }  // Novo tema
   }
   ```

2. Estender `ThemeType` e `getCurrentThemePalette()`

3. Nenhuma outra mudança necessária

## Próximos passos (out of scope)

- [ ] Sistema de preferência SO (prefers-color-scheme)
- [ ] Persistência em backend/database
- [ ] Animação suave ao trocar tema
- [ ] Mais temas (sepia, high-contrast, etc)
- [ ] Integração com sistema de notificações
