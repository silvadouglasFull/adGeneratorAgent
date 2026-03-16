# Spec: Serviço de Catálogo de Modelos (separado do agente)

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Criar um serviço dedicado para consulta de modelos de IA disponíveis no provider Google Generative Language API, desacoplado do `adGeneratorAgent`, reaproveitando a lógica já validada de:

- `getAvailableModels(userId)`
- `getFreeModels(userId)`
- `getModelInfo(modelName, userId)`

O objetivo é centralizar a descoberta e seleção de modelos em um único serviço reutilizável, mantendo o agente focado apenas em geração de anúncios.

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

- Obter API key do usuário por repositório/adapter de chave;
- Se usuário não tiver chave, retornar `[]`;
- Consultar endpoint:
  - `https://generativelanguage.googleapis.com/v1beta/models?key=<API_KEY>`
- Se payload não tiver `models`, retornar `[]`;
- Filtrar somente modelos aptos a geração:
  - deve conter `generateContent` **ou** `bidiGenerateContent` em `supportedGenerationMethods`;
  - excluir modelos task-specific (`embedding`, `aqa`);
- Mapear para `ChatModel` do domínio;
- Acrescentar modelo default configurado na aplicação;
- Em erro de integração, logar e retornar `[]`.

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
    repository/
      UserGenAiApiKeyRepository.ts (adapter/porta)
```

### Responsabilidades

- `ModelCatalogService` (application): orquestra caso de uso de catálogo;
- `GoogleModelsProvider` (infrastructure): chamada HTTP externa e parsing bruto;
- `UserGenAiApiKeyRepository` (infrastructure): recuperação de chave por `userId`;
- `ChatModel` (domain): contrato de saída de modelo.

### SOLID aplicado

- SRP: cada classe com responsabilidade única;
- OCP: novos providers (OpenAI, Anthropic) via implementação de interface;
- DIP: serviço depende de abstrações (`IModelsProvider`, `IApiKeyRepository`).

## Critérios de Aceitação

- [ ] Criar `ModelCatalogService` separado do agente (`adGeneratorAgent` não consulta API de modelos diretamente)
- [ ] Implementar `getAvailableModels(userId)` com mesmas regras do serviço de referência
- [ ] Implementar `getFreeModels(userId)` reutilizando `getAvailableModels`
- [ ] Implementar `getModelInfo(modelName, userId)` reutilizando `getAvailableModels`
- [ ] Em falta de API key, retorno deve ser `[]` (sem throw)
- [ ] Em erro na API externa, retorno deve ser `[]` com log de erro
- [ ] Adicionar modelo default no resultado de disponíveis
- [ ] Cobrir cenários com testes unitários (sucesso, sem chave, sem models, erro de fetch, filtros)
- [ ] `pnpm test` verde
- [ ] `npx tsc --noEmit` sem erros

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
  - Mitigação: normalizar parsing em provider dedicado com testes de contrato.
