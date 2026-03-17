# Spec: Serviço de Catálogo de Modelos (OpenAI + Google Gemini)

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Criar um serviço dedicado para consulta de modelos de IA disponíveis nos providers **OpenAI** e **Google Gemini**, desacoplado do `adGeneratorAgent`, reaproveitando a lógica já validada de:

- `getAvailableModels(userId)`
- `getFreeModels(userId)`
- `getModelInfo(modelName, userId)`

O objetivo é centralizar a descoberta e seleção de modelos em um único serviço reutilizável, mantendo o agente focado apenas em geração de anúncios e retornando uma lista unificada multi-provider.

## Problema Atual

A aplicação de referência já possui lógica de catálogo de modelos em outro contexto (`ModelService.ts`), mas essa lógica não está formalmente isolada como módulo reutilizável no projeto atual do agente.

Sem esse serviço separado:

- o agente tende a acumular responsabilidade de descoberta de modelos;
- o catálogo de modelos fica acoplado ao fluxo de geração;
- reuso entre rotas/futuros casos de uso fica limitado.

## Objetivo da Feature

Implementar um `ModelCatalogService` independente do agente, com contrato explícito e testável para:

1. Listar modelos disponíveis para chat/geração de conteúdo;
2. Filtrar modelos gratuitos;
3. Buscar metadados de um modelo específico por nome.

## Contrato Funcional

### Método 1 — `getAvailableModels(userId: string): Promise<ChatModel[]>`

Regras:

- Obter API key do usuário por repositório/adapter de chave, por provider;
- Consultar modelos da OpenAI quando houver chave OpenAI;
- Consultar modelos do Google Gemini quando houver chave Gemini;
- Regras do provider Google Gemini:
  - endpoint `https://generativelanguage.googleapis.com/v1beta/models?key=<API_KEY>`;
  - se payload não tiver `models`, retornar `[]` para esse provider;
  - filtrar modelos aptos a geração (`generateContent` ou `bidiGenerateContent`);
  - excluir modelos task-specific (`embedding`, `aqa`);
- Regras do provider OpenAI:
  - consultar endpoint de listagem de modelos do provider;
  - filtrar modelos aptos ao contexto de chat/generation do projeto;
- Mapear cada provider para `ChatModel` do domínio;
- Mesclar listas dos dois providers com deduplicação por `name`;
- Acrescentar modelo(s) default configurado(s) na aplicação (quando aplicável);
- Se usuário não tiver nenhuma chave válida, retornar `[]`;
- Em erro de integração de um provider, logar e seguir com os demais (degradação parcial);
- Em erro total (todos providers indisponíveis), retornar `[]`.

### Método 2 — `getFreeModels(userId: string): Promise<ChatModel[]>`

Regras:

- Reusar `getAvailableModels(userId)`;
- Retornar apenas `isFree === true`.

### Método 3 — `getModelInfo(modelName: string, userId: string): Promise<ChatModel | undefined>`

Regras:

- Reusar `getAvailableModels(userId)`;
- Retornar o item cuja propriedade `name` seja igual ao `modelName`.

## Requisitos de Arquitetura (DDD + SOLID)

### Camadas esperadas

```text
src/agent/
  domain/
    model/
      ChatModel.ts
    service/
      IModelCatalogService.ts
  application/
    service/
      ModelCatalogService.ts
  infrastructure/
    providers/
      GoogleModelsProvider.ts
      OpenAIModelsProvider.ts
    repository/
      UserApiKeyRepository.ts (adapter/porta por provider)
```

### Responsabilidades

- `ModelCatalogService` (application): orquestra caso de uso de catálogo;
- `GoogleModelsProvider` (infrastructure): chamada HTTP externa e parsing bruto;
- `OpenAIModelsProvider` (infrastructure): chamada HTTP externa e parsing bruto;
- `UserApiKeyRepository` (infrastructure): recuperação de chave por `userId` e provider;
- `ChatModel` (domain): contrato de saída de modelo.

### SOLID aplicado

- SRP: cada classe com responsabilidade única;
- OCP: novos providers (OpenAI, Anthropic) via implementação de interface;
- DIP: serviço depende de abstrações (`IModelsProvider`, `IApiKeyRepository`).

## Critérios de Aceitação

- [x] Criar `ModelCatalogService` separado do agente (`adGeneratorAgent` não consulta API de modelos diretamente)
- [x] Implementar `getAvailableModels(userId)` com agregação OpenAI + Google Gemini
- [x] Implementar `getFreeModels(userId)` reutilizando `getAvailableModels`
- [x] Implementar `getModelInfo(modelName, userId)` reutilizando `getAvailableModels`
- [x] Mesclar os modelos dos dois providers com deduplicação por nome
- [x] Em falta de API key de ambos providers, retorno deve ser `[]` (sem throw)
- [x] Em erro de um provider, manter retorno parcial com os modelos do provider saudável
- [x] Em erro de todos providers, retorno deve ser `[]` com log de erro
- [x] Adicionar modelo(s) default no resultado de disponíveis (quando aplicável)
- [x] Cobrir cenários com testes unitários (sucesso, sem chave, sem models, erro de fetch por provider, filtros, merge, deduplicação)
- [x] `pnpm test` verde
- [x] `npx tsc --noEmit` sem erros

## Regras de Compatibilidade

- Não alterar contrato público existente do agente (`adGeneratorAgent`, `streamGeneratedAd`);
- Serviço novo deve ser complementar e reutilizável por rotas futuras;
- Evitar breaking changes em tipos públicos já utilizados.

## Não-Objetivos desta feature

- Alterar fluxo de geração do anúncio;
- Introduzir UI de seleção dinâmica baseada no catálogo;
- Implementar cache distribuído.

## Riscos e Mitigações

- Risco: latência/chamada externa a cada consulta.
  - Mitigação: deixar extensão de cache em memória prevista na interface, sem forçar agora.
- Risco: variabilidade de payload da API.
  - Mitigação: normalizar parsing em providers dedicados com testes de contrato.
- Risco: indisponibilidade parcial de provider.
  - Mitigação: degradação parcial (retornar modelos dos providers saudáveis).
