# Spec: Avatar com Tooltip de Nome do Usuário ao lado do ThemeToggle

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Adicionar um componente de avatar genérico ao lado do botão de tema (`ThemeToggle`) no cabeçalho da aplicação.

Quando o usuário passar o mouse sobre o avatar, deve ser exibido um tooltip com o nome do usuário autenticado.

## Referência de Documentação

- Flowbite Avatar: https://flowbite.com/docs/components/avatar/
- Flowbite Tooltip: https://flowbite.com/docs/components/tooltips/
- NextAuth signOut: https://next-auth.js.org/getting-started/client#signout

Pontos aplicados dessas referências:

- Avatar placeholder pode ser renderizado com contêiner circular e ícone SVG genérico;
- Tooltip deve usar `role="tooltip"` e classes de visibilidade/opacity com transição;
- Trigger por hover (`data-tooltip-trigger="hover"`) é o padrão esperado;
- Estrutura de tooltip deve suportar seta com `data-popper-arrow` quando aplicável.

## Objetivo da Feature

- Exibir identificação visual do usuário no topo da aplicação;
- Exibir nome do usuário de forma rápida via tooltip ao hover;
- Permitir logout via dropdown exibido ao clicar no avatar;
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
- Edição de perfil;
- Novos fluxos de autenticação;
- Menu com múltiplas opções além do logout.

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

### RF5 — Dropdown de Logout ao Clicar no Avatar

- Ao clicar no avatar, exibir um dropdown com botão "Sair";
- O dropdown deve fechar ao clicar fora dele;
- Ao clicar em "Sair", chamar `signOut({ callbackUrl: '/auth/login' })` de `next-auth/react`;
- O dropdown deve exibir o nome do usuário e a opção de logout.

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

- [x] Existe componente de avatar genérico reutilizável
- [x] O avatar é exibido ao lado do botão `ThemeToggle` no topo
- [x] O tooltip aparece no hover do avatar
- [x] O tooltip exibe o nome do usuário autenticado
- [x] Existe fallback para `Usuário` quando `session.user.name` estiver ausente
- [x] Tooltip usa marcação acessível com `role="tooltip"`
- [ ] Ao clicar no avatar, exibe dropdown com nome do usuário e botão "Sair"
- [ ] Dropdown fecha ao clicar fora
- [ ] Clicar em "Sair" executa `signOut` com redirect para `/auth/login`
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
4. Dropdown de logout exibido ao clicar no avatar;
5. `signOut` chamado com redirect correto ao clicar em "Sair";
6. Build/types e testes sem regressões.
