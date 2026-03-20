# Spec: Paletas de Cores Dinâmicas por Flavor

## O quê e porquê

Para melhorar a manutenção e centralização do sistema de flavor, precisamos de um sistema centralizado para gerenciar paletas de cores. Atualmente, as cores são hardcoded no CSS global, dificultando a manutenção e reutilização.

Esta funcionalidade vai:

- Centralizar todas as cores em um único arquivo (`src/flavor/flavor.ts`)
- Permitir fácil customização de cores por flavor
- Injetar dinamicamente as cores via CSS Variables (custom properties)
- Facilitar manutenção sem modificar CSS em múltiplos lugares

## Visão geral

A solução utiliza **CSS Variables (custom properties)** para máxima simplicidade e performance:

1. Definir constante `colorPalettes` em `src/flavor/flavor.ts` com cores do flavor atual
2. Criar utilitário para converter a paleta em CSS Variables válidas
3. Integrar injeção no componente `RootLayout`
4. Atualizar `globals.css` para usar as variáveis
5. Testar que CSS Variables carregam corretamente

## Detalhes técnicos

### colorPalettes - Constante de cores

```typescript
export const colorPalettes = {
  primary: string;      // Cor principal da marca
  secondary: string;    // Cor secundária
  accent: string;       // Cor de destaque/ação
  text: string;         // Texto principal
  textLight: string;    // Texto secundário/cinzento
  border: string;       // Bordas
  background: string;   // Background principal
}
```

Valores exemplo para `ds-web` (padrão):

- `primary: '#3B82F6'` (azul)
- `secondary: '#1F2937'` (cinza escuro)
- `accent: '#F59E0B'` (âmbar)
- `text: '#000000'` (preto)
- `textLight: '#6B7280'` (cinza claro)
- `border: '#E5E7EB'` (cinza muito claro)
- `background: '#FFFFFF'` (branco)

Para trocar de flavor, edita-se apenas esta constante em `flavor.ts`.

### Carregamento

A paleta é carregada:

1. Importada diretamente de `src/flavor/flavor.ts`
2. Convertida para CSS Variables via função utilitária
3. Injetada como `<style>` tag no `<head>` durante a renderização do `RootLayout`

### CSS Variables

As variáveis serão nomeadas com prefixo `--color-`:

```css
--color-primary
--color-secondary
--color-accent
--color-text
--color-text-light
--color-border
--color-background
```

## Critérios de Aceitação

- [x] `colorPalettes` definida em `src/flavor/flavor.ts` como objeto simples
- [x] Função `getCSSVariablesFromPalette()` exportada que retorna CSS string válida
- [x] Integração com `RootLayout` sem quebrar SSR
- [x] CSS Variables disponíveis globalmente em `globals.css`
- [x] TypeScript: nenhum `any` não justificado
- [x] Nomes descritivos para constantes e funções
- [x] Testes unitários para `getCSSVariablesFromPalette()`
- [x] `pnpm test` passa
- [x] `npx tsc --noEmit` passa sem erros
- [x] Cores visualmente renderizam corretamente no navegador

## Estrutura de arquivo

```
src/flavor/
  ├── flavor.ts          (updated: add colorPalettes + getCSSVariablesFromPalette)
  └── (existente)
```

Sem novas pastas - mantém centralização máxima como solicitado.

## Padrões aplicados

- **DDD**: Paleta é um Value Object de domínio visual, centralizado em `flavor.ts`
- **SOLID**:
  - **S**: Função única de converter paleta para CSS
  - **D**: Injetor não depende de múltiplas paletas
- **Clean Code**: Nomes auto-explicativos, sem `any`, arquivos simples

## Como customizar para outro flavor

Para trocar de flavor:

1. Editar `src/flavor/flavor.ts`
2. Atualizar valores em `colorPalettes`
3. Nenhuma outra mudança necessária - CSS Variables carregam automaticamente

## Próximos passos (out of scope)

- Modo escuro dinâmico
- Gerador de paleta baseado em color picker
- Sincronização de flavor entre abas
- Animação ao mudar flavor
