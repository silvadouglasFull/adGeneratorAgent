# Spec: Rota de Modelos Disponíveis + Dropdown de Seleção no Chat

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Implementar uma rota HTTP para listar modelos de IA disponíveis e atualizar a interface do chat para usar um componente `dropdown` de seleção de modelo, substituindo o grid atual de botões.

A seleção feita no dropdown deve continuar sendo enviada para o endpoint de geração (`POST /api/agent/generate`) sem alterar o contrato funcional existente do chat.

## Problema Atual

A tela inicial usa um grid estático de botões para seleção de modelo, o que:

- dificulta escalabilidade quando a lista de modelos crescer;
- acopla a UI a uma lista local fixa;
- não reaproveita o catálogo de modelos disponível no backend.

## Objetivo da Feature

1. Criar rota para listar modelos disponíveis para o usuário;
2. Criar um componente `dropdown` de seleção de modelos de IA;
3. Substituir o bloco de grid atual por esse dropdown;
4. Manter o comportamento de envio do modelo selecionado no chat.

## Escopo

### Incluído

- Nova rota de leitura de modelos disponíveis;
- Componente de UI para seleção via dropdown;
- Integração do dropdown em `src/app/page.tsx`;
- Remoção do grid de modelos atualmente renderizado;
- Atualização/adição de testes unitários e de rota.

### Não incluído

- Mudança no fluxo de geração do anúncio;
- Alterações no contrato de `POST /api/agent/generate`;
- Novos provedores além dos já suportados pelo catálogo;
- Paginação/filtros avançados na listagem de modelos.

## Contrato da API

### Endpoint

`GET /api/agent/models`

### Response 200

```json
{
  "models": [
    {
      "name": "gpt-4o-mini",
      "displayName": "GPT-4o Mini",
      "provider": "openai",
      "isFree": false
    },
    {
      "name": "gemini-2.0-flash",
      "displayName": "Gemini 2.0 Flash",
      "provider": "google-genai",
      "isFree": true
    }
  ]
}
```

### Response 500

```json
{
  "error": "Não foi possível carregar os modelos disponíveis."
}
```

## Requisitos Funcionais

### RF1 — Rota de Modelos

- Implementar `GET /api/agent/models` em App Router;
- A rota deve obter modelos do serviço de catálogo (sem hardcode na rota);
- Em sucesso, retornar `models` padronizado para a UI;
- Em erro, retornar status 500 com mensagem clara.

### RF2 — Dropdown de Seleção

- Criar componente de dropdown para seleção de modelo;
- Exibir label amigável e provider de cada modelo;
- Permitir seleção de 1 modelo por vez;
- Definir fallback para `gpt-4o-mini` quando não houver seleção válida.

### RF3 — Troca do Grid pelo Dropdown

- Remover o trecho de grid de botões atualmente usado para seleção de modelo;
- Renderizar somente o dropdown no lugar do grid;
- Manter compatibilidade com o envio atual (`model: selectedModel` no body).

### RF4 — Integração com Chat

- Ao submeter o formulário, usar o modelo escolhido no dropdown;
- Preservar comportamento atual de loading, stream e tratamento de erro.

## Requisitos Não Funcionais

- Código em TypeScript sem uso de `any` não justificado;
- Responsabilidades separadas conforme DDD/SOLID/Clean Code;
- Testes claros e diretos cobrindo os critérios de aceitação;
- Sem regressão do comportamento existente da página.

## Estrutura Técnica Esperada

```text
src/
  app/
    api/
      agent/
        models/
          route.ts
          __tests__/
            route.test.ts
    page.tsx
  components/
    ModelDropdown.tsx
```

Observação: o caminho exato do componente pode seguir padrão existente do projeto, desde que o objetivo da feature seja preservado.

## Critérios de Aceitação

- [x] Existe rota `GET /api/agent/models` funcional
- [x] A rota retorna lista de modelos consumível pela UI
- [x] O grid de seleção foi removido de `src/app/page.tsx`
- [x] Um dropdown de modelos foi adicionado no lugar do grid
- [x] O modelo selecionado no dropdown é enviado para `POST /api/agent/generate`
- [x] Em falha na carga de modelos, a UI exibe erro amigável
- [x] Testes de rota e UI relacionados passam
- [x] `pnpm test` passa
- [x] `npx tsc --noEmit` passa sem erros

## Restrições

- Não inventar requisitos além desta spec;
- Não alterar comportamento de geração além da seleção do modelo na UI;
- Não mudar contratos públicos sem atualizar tasks/spec.

## Definição de Pronto (DoD)

1. Rota de modelos implementada e testada;
2. Dropdown implementado e integrado na tela;
3. Grid removido sem regressão de funcionalidade;
4. Testes e type-check verdes.
