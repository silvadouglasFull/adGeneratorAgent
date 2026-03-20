# Tasks: Sistema de Tema Dark/Light Dinâmico

**Status**: ✅ Concluído  
**Spec**: [dark-light-theme-toggle.md](specs/dark-light-theme-toggle.md)  
**Critério de aceitação**: Todos os checkboxes abaixo devem passar

## Epic: Implementar tema dark/light com validação de paletas

### 1. Atualizar `flavor.ts` com tipos e funções de tema

**Objetivo**: Adicionar tipos TypeScript e funções de validação

- [ ] Criar interface `ColorPalette` com propriedades:

  ```typescript
  interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textLight: string;
    border: string;
    background: string;
  }
  ```

- [ ] Criar tipo `ThemeType = 'light' | 'dark'`

- [ ] Criar interface `ThemeConfig`:

  ```typescript
  interface ThemeConfig {
    lightColors: ColorPalette;
    darkColors?: ColorPalette; // Opcional
  }
  ```

- [ ] Atualizar `colorPalettes` para aderir a `ThemeConfig`
  - Validar que `lightColors` sempre existe
  - `darkColors` é opcional (verificado em runtime)

- [ ] Adicionar função `isThemeToggleAvailable(): boolean`
  - Retorna `true` se `darkColors` existe
  - Retorna `false` caso contrário

- [ ] Adicionar função `getCurrentThemePalette(theme: ThemeType): ColorPalette`
  - Se `theme === 'dark'` e `darkColors` existe, retorna `darkColors`
  - Caso contrário, retorna `lightColors`

- [ ] Adicionar função `getCSSVariablesFromTheme(theme: ThemeType): string`
  - Similar a `getCSSVariablesFromPalette()` pré-existente
  - Usa `getCurrentThemePalette(theme)` para gerar CSS
  - Retorna: `:root { --color-primary: ...; ... }`

- [ ] Testes unitários em `src/flavor/__tests__/flavor.test.ts`
  - Testa `isThemeToggleAvailable()` com darkColors presente/ausente
  - Testa `getCurrentThemePalette('light')` e `getCurrentThemePalette('dark')`
  - Testa `getCSSVariablesFromTheme()` para ambos os temas

**Checklist técnico**:

```
- [ ] Sem eslint/TypeScript errors
- [ ] `pnpm test -- flavor.test.ts` passa
- [ ] Interfaces bem documentadas com JSDoc
```

---

### 2. Criar Hook `useTheme` em `src/hooks/useTheme.ts`

**Objetivo**: Gerenciar estado do tema e persistência

- [ ] Criar arquivo `src/hooks/useTheme.ts`

- [ ] Implementar Hook que:
  - Lê tema do `localStorage` com chave `'theme'`
  - Fallback: `'light'` se não encontrado
  - Valida se tema é `'light'` ou `'dark'`
  - Se inválido, usa `'light'`

- [ ] Retornar objeto com:

  ```typescript
  {
    theme: 'light' | 'dark'                    // Tema atual
    toggleTheme: () => void                    // Função para trocar
    isAvailable: boolean                       // darkColors existe?
  }
  ```

- [ ] Função `toggleTheme()`:
  - Se tema é `'light'`, muda para `'dark'` (se disponível)
  - Se tema é `'dark'`, muda para `'light'`
  - Se darkColors não existe, não faz nada

- [ ] Persiste mudança em `localStorage` automaticamente

- [ ] Testes unitários em `src/hooks/__tests__/useTheme.test.ts`
  - Testa leitura do localStorage
  - Testa fallback para 'light'
  - Testa toggle de tema
  - Testa persistência em localStorage

**Checklist técnico**:

```
- [ ] Sem eslint/TypeScript errors
- [ ] `pnpm test -- useTheme.test.ts` passa
- [ ] Sem side effects não esperados
```

---

### 3. Criar componente `ThemeToggle` em `src/components/ThemeToggle.tsx`

**Objetivo**: Botão isolado para trocar tema

- [ ] Criar arquivo `src/components/ThemeToggle.tsx`

- [ ] Usar Hook `useTheme()` para obter estado

- [ ] Se `isAvailable === false`, retornar `null`
  - Nenhum botão é renderizado se darkColors não existe

- [ ] Se disponível, renderizar botão:
  - Classe: `.btn-ghost` (ou `.btn`)
  - Ícone: 🌙 se tema atual é `'light'`, ☀️ se `'dark'`
  - Label: aria-label descrevendo ação
  - onClick: chama `toggleTheme()`

- [ ] Exemplo:

  ```tsx
  export function ThemeToggle(): JSX.Element | null {
    const { theme, toggleTheme, isAvailable } = useTheme();

    if (!isAvailable) return null;

    return (
      <button
        className="btn-ghost"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    );
  }
  ```

- [ ] Componente pode ser importado de qualquer lugar

  ```tsx
  import { ThemeToggle } from "@/components/ThemeToggle";
  ```

- [ ] Testes unitários em `src/components/__tests__/ThemeToggle.test.tsx`
  - Testa renderização quando darkColors existe
  - Testa não renderização quando darkColors não existe
  - Testa click abre toggle

**Checklist técnico**:

```
- [ ] Sem eslint/TypeScript errors
- [ ] `pnpm test -- ThemeToggle.test.tsx` passa
- [ ] Componente isolado (sem dependências externas além de useTheme)
```

---

### 4. Integrar ThemeToggle no Layout e injetar CSS Variables

**Objetivo**: Conectar tema ao RootLayout e aplicar cores

- [ ] Abrir `src/app/layout.tsx`

- [ ] Importar:
  - `getCSSVariablesFromTheme` de `@/flavor/flavor`
  - `useTheme` de `@/hooks/useTheme`
  - `ThemeToggle` de `@/components/ThemeToggle`

- [ ] Usar Hook `useTheme()` no layout (componente deve ser Client Component)
  - Ou criar ClientLayout wrapper se necessário

- [ ] Injetar `<style>` tag no `<head>`:

  ```tsx
  <style
    dangerouslySetInnerHTML={{
      __html: getCSSVariablesFromTheme(theme),
    }}
  />
  ```

- [ ] Adicionar `ThemeToggle` no header/navbar:
  - Colocar em local visível (ex: canto superior direito)
  - Pode estar junto com outros elementos de header

- [ ] Validar que:
  - CSS Variables mudam ao clicar no botão
  - Mudança reflete imediatamente na UI
  - Sem flash de cores incorretas

**Checklist técnico**:

```
- [ ] `pnpm dev` roda sem erros
- [ ] Browser DevTools mostra CSS Variables corretas por tema
- [ ] ThemeToggle renderiza quando darkColors existe
```

---

### 5. Testes de integração e validação

**Objetivo**: Validar tema dark/light funciona end-to-end

- [ ] Testes visuais (manual):
  - Abrir `pnpm dev`
  - Verificar tema padrão é `'light'`
  - Clicar em botão ThemeToggle
  - Cores mudam para tema dark
  - Clicar novamente, volta para light
  - Refresh página → tema persiste

- [ ] Testes de CSS Variables:
  - Em browser DevTools, inspecionar `:root`
  - Verificar que `--color-primary`, etc mudam conforme tema
  - Nenhuma cor fica `undefined`

- [ ] Testes de localStorage:
  - Abrir localStorage em browser DevTools
  - Deve ter chave `'theme'` com valor `'light'` ou `'dark'`
  - Mudar tema → valor em localStorage atualiza
  - Fechar e reabrir → tema é restaurado

- [ ] Testes de validação:
  - Se remover `darkColors` de `flavor.ts` → botão desaparece
  - Se adicionar `darkColors` → botão reaparece

**Checklist técnico**:

```
- [ ] `pnpm build` passa
- [ ] `pnpm test` passa todos os testes
- [ ] Nenhum erro no console do navegador
- [ ] `npx tsc --noEmit` sem erros
```

---

### 6. Documentação e cleanup

**Objetivo**: Deixar código limpo e documentado

- [ ] Adicionar comentários JSDoc em `flavor.ts`:
  - Explicar `isThemeToggleAvailable()`
  - Como usar `getCurrentThemePalette()`
  - Como estruturar colorPalettes com darkColors

- [ ] Adicionar comentário em `useTheme.ts`:
  - Como usar o hook
  - O que ele retorna
  - Exemplo de uso

- [ ] Adicionar comentário em `ThemeToggle.tsx`:
  - Que é um componente isolado
  - Retorna null se darkColors não existe
  - Como importar e usar

- [ ] Remover console.log, arquivos temporários, código de debug

**Checklist técnico**:

```
- [ ] `pnpm lint` sem warnings críticos
- [ ] `npx tsc --noEmit` sem erros
- [ ] Código pronto para produção
```

---

## Critério de Aceitação Final

✅ `isThemeToggleAvailable()` funciona corretamente  
✅ `getCurrentThemePalette()` retorna paleta correta  
✅ `getCSSVariablesFromTheme()` gera CSS válido  
✅ Hook `useTheme()` gerencia estado e persistência  
✅ Componente `ThemeToggle` renderiza/oculta conforme configuração  
✅ Tema carrega do localStorage com fallback para light  
✅ CSS Variables mudam conforme tema ativo  
✅ Toggle funciona sem refresh  
✅ Mudança persiste entre sessões  
✅ Todos os testes passam: `pnpm test`  
✅ Build bem-sucedido: `pnpm build`  
✅ TypeScript sem erros: `npx tsc --noEmit`  
✅ Lint limpo: `pnpm lint`  
✅ Documentação em código via JSDoc

## Estimativa

- Task 1: 30min
- Task 2: 25min
- Task 3: 20min
- Task 4: 20min
- Task 5: 20min
- Task 6: 15min
- **Total**: ~130min (2h10min)
