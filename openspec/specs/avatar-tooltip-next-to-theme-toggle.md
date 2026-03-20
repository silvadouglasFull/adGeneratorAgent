# Spec: Avatar com Tooltip de Nome do Usuário ao lado do ThemeToggle

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Adicionar um componente de avatar genérico ao lado do botão de tema (`ThemeToggle`) no cabeçalho da aplicação.

Quando o usuário passar o mouse sobre o avatar, deve ser exibido um tooltip com o nome do usuário autenticado.

## Referência de Documentação

- Flowbite Avatar: https://flowbite.com/docs/components/avatar/
- Flowbite Tooltip: https://flowbite.com/docs/components/tooltips/

Pontos aplicados dessas referências:

- Avatar placeholder pode ser renderizado com contêiner circular e ícone SVG genérico;
- Tooltip deve usar `role="tooltip"` e classes de visibilidade/opacity com transição;
- Trigger por hover (`data-tooltip-trigger="hover"`) é o padrão esperado;
- Estrutura de tooltip deve suportar seta com `data-popper-arrow` quando aplicável.

## Objetivo da Feature

- Exibir identificação visual do usuário no topo da aplicação;
- Exibir nome do usuário de forma rápida via tooltip ao hover;
- Manter consistência visual com o padrão Tailwind/Flowbite já usado no projeto;
- Posicionar avatar imediatamente ao lado do `ThemeToggle`.

## Escopo

### Incluído

- Criar componente de avatar genérico reutilizável;
- Posicionar avatar ao lado do `ThemeToggle` no layout superior;
- Mostrar tooltip no hover com nome do usuário;
- Obter nome do usuário autenticado da sessão atual;
- Definir fallback de nome quando sessão não tiver `name`.

### Não incluído

- Upload de foto de perfil;
- Dropdown de menu do usuário;
- Edição de perfil;
- Novos fluxos de autenticação.

## Requisitos Funcionais

### RF1 — Exibição do Avatar

- Renderizar avatar genérico no topo da aplicação, ao lado do `ThemeToggle`;
- Avatar deve ter formato circular e ícone de usuário genérico (SVG);
- Avatar deve manter tamanho fixo e previsível (ex.: 40x40).

### RF2 — Tooltip com Nome do Usuário

- Ao passar o mouse sobre o avatar, exibir tooltip com o nome do usuário;
- Tooltip deve desaparecer ao sair do hover;
- Tooltip deve usar marcação acessível (`role="tooltip"`).

### RF3 — Origem do Nome

- Nome deve vir da sessão autenticada (`session.user.name`);
- Quando `name` estiver ausente, usar fallback `Usuário`;
- Não exibir dados sensíveis no tooltip.

### RF4 — Posicionamento no Layout

- Avatar deve ficar ao lado do `ThemeToggle`, no mesmo bloco de ações do topo;
- Espaçamento entre avatar e toggle deve seguir utilitários Tailwind já existentes no layout.

## Requisitos Não Funcionais

- Implementação em TypeScript sem `any` não justificado;
- Código legível e simples, sem overengineering;
- Seguir organização atual do projeto e padrões DDD/Clean Code quando aplicável;
- Não introduzir bibliotecas novas para essa feature.

## Estrutura Técnica Esperada

```text
src/
  components/
    user/
      UserAvatarWithTooltip.tsx
  app/
    layout.tsx (ajuste de posicionamento)
```

Observação: o caminho final pode variar conforme estrutura vigente, mantendo os objetivos desta spec.

## Contrato de UI

- Trigger visual: avatar circular com ícone genérico;
- Trigger de interação: hover no avatar;
- Conteúdo do tooltip: texto simples com nome do usuário;
- Acessibilidade mínima:
  - `aria-label` no avatar;
  - `role="tooltip"` no elemento de tooltip.

## Critérios de Aceitação

- [ ] Existe componente de avatar genérico reutilizável
- [ ] O avatar é exibido ao lado do botão `ThemeToggle` no topo
- [ ] O tooltip aparece no hover do avatar
- [ ] O tooltip exibe o nome do usuário autenticado
- [ ] Existe fallback para `Usuário` quando `session.user.name` estiver ausente
- [ ] Tooltip usa marcação acessível com `role="tooltip"`
- [ ] `pnpm test` passa
- [ ] `npx tsc --noEmit` passa sem erros

## Restrições

- Não criar menu dropdown do avatar nesta entrega;
- Não alterar fluxo de autenticação atual;
- Não adicionar comportamentos além de avatar + tooltip de nome.

## Definição de Pronto (DoD)

1. Avatar visível ao lado do `ThemeToggle`;
2. Tooltip de hover funcionando com nome do usuário;
3. Fallback de nome funcionando;
4. Build/types e testes sem regressões.
