# Tasks: LiteLLM Proxy com Fallback Automático de Modelos

Spec de referência: `openspec/specs/litellm-model-fallback.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

Status: **Concluído em 18/03/2026**

---

## Fase 1 — Infraestrutura Docker

### T1 — Criar arquivo de configuração do LiteLLM

- [x] Criar diretório `litellm/` na raiz do projeto
- [x] Criar `litellm/config.yaml` com:
  - [x] `model_list` com `gpt-4o-mini` (provider `openai`) e `gemini-2.0-flash` (provider `gemini`)
  - [x] Cada modelo referencia API key via `os.environ/` (ex: `os.environ/OPENAI_API_KEY`, `os.environ/GENAI_API`)
  - [x] `litellm_settings.fallbacks` com fallback bidirecional:
    - `gpt-4o-mini` → `["gemini-2.0-flash"]`
    - `gemini-2.0-flash` → `["gpt-4o-mini"]`
  - [x] `litellm_settings.num_retries: 1`
  - [x] `litellm_settings.request_timeout: 30`
  - [x] `general_settings.master_key` via `os.environ/LITELLM_API_KEY`
- **Critério**: Arquivo YAML válido, referências de env vars corretas

### T2 — Adicionar serviço LiteLLM ao docker-compose.yml

- [x] Adicionar serviço `litellm` ao `docker-compose.yml`:
  - [x] Imagem: `ghcr.io/berriai/litellm:main-latest`
  - [x] Container name: `ad-generator-litellm`
  - [x] Porta: `${LITELLM_PORT:-4000}:4000`
  - [x] Volume: `./litellm/config.yaml:/app/config.yaml`
  - [x] Variáveis de ambiente: `OPENAI_API_KEY`, `GENAI_API`, `LITELLM_API_KEY`
  - [x] Command: `["--config", "/app/config.yaml", "--port", "4000"]`
  - [x] Healthcheck autenticado no endpoint `/health`
  - [x] Restart policy: `unless-stopped`
- [x] Validar que `docker compose up litellm` sobe sem erros
- **Critério**: Container inicia, healthcheck passa, `GET http://localhost:4000/health` retorna 200

### T3 — Atualizar variáveis de ambiente

- [x] Adicionar ao `.env.local.example`:
  - `LITELLM_PROXY_URL=http://localhost:4000`
  - `LITELLM_API_KEY=sk-litellm-master-key`
  - `LITELLM_PORT=4000`
- **Critério**: `.env.local.example` documenta todas as novas variáveis

---

## Fase 2 — Infraestrutura de Código (Provider)

### T4 — Criar interface `ILiteLLMProxyProvider`

- [x] Criar `src/agent/domain/service/ILiteLLMProxyProvider.ts`
- [x] Definir interface:
  ```typescript
  interface ILiteLLMProxyProvider {
    create(
      model: SupportedModel,
      options?: ModelProviderOptions,
    ): BaseChatModel;
    isAvailable(): Promise<boolean>;
  }
  ```
- [x] A interface segue ISP (Interface Segregation) — apenas o necessário
- **Critério**: Interface compilável, sem dependência de infraestrutura

### T5 — Implementar `LiteLLMProxyProvider`

- [x] Criar `src/agent/infrastructure/providers/LiteLLMProxyProvider.ts`
- [x] Implementar `ILiteLLMProxyProvider`
- [x] Construtor recebe `proxyUrl: string` e `apiKey: string`
- [x] Método `create(model, options?)`:
  - [x] Retorna `ChatOpenAI` do `@langchain/openai` com:
    - [x] `model` = nome do modelo solicitado (LiteLLM roteia internamente)
    - [x] `configuration.baseURL` = `this.proxyUrl` (ex: `http://localhost:4000/v1`)
    - [x] `apiKey` = `this.apiKey` (master key do LiteLLM)
    - [x] `temperature: 0.7`, `maxRetries: 0`
  - [x] Se `options?.heliconeRequestId` presente, adicionar header `Helicone-Request-Id`
- [x] Método `isAvailable()`:
  - [x] Faz `fetch(${this.proxyUrl}/health)` com timeout de 2 segundos
  - [x] Retorna `true` se status 200, `false` caso contrário
  - [x] Captura qualquer erro de rede e retorna `false` (sem lançar exceção)
- **Critério**: Classe instanciável, `create()` retorna `BaseChatModel`, `isAvailable()` funciona

### T6 — Testes unitários do `LiteLLMProxyProvider`

- [x] Criar `src/agent/__tests__/infrastructure/LiteLLMProxyProvider.test.ts`
- [x] Testar `create()`: retorna instância de `ChatOpenAI` com `baseURL` correto
- [x] Testar `create()`: passa modelo correto para o `ChatOpenAI`
- [x] Testar `isAvailable()`: retorna `true` quando health endpoint responde 200
- [x] Testar `isAvailable()`: retorna `false` quando health endpoint falha
- [x] Testar `isAvailable()`: retorna `false` quando fetch lança erro de rede
- **Critério**: 5 testes passando, mock de `fetch` e `ChatOpenAI`

---

## Fase 3 — Refatoração do ModelInitializerService

### T7 — Refatorar `ModelInitializerService` para suportar LiteLLM Proxy

- [x] Em `src/agent/domain/service/ModelInitializerService.ts`:
  - [x] Adicionar parâmetro opcional `liteLLMProvider?: ILiteLLMProxyProvider` no construtor
  - [x] Alterar método `initialize()`:
    1. Se `modelName` é modelo de imagem (`gpt-image-1.5` ou provider `openai-image`) → chamada direta (sem proxy), comportamento atual
    2. Se `liteLLMProvider` existe e `await liteLLMProvider.isAvailable()` → usar `liteLLMProvider.create(modelName, options)`
    3. Senão → comportamento atual (modelProviderFactory ou chamada direta)
  - [x] A checagem de `isAvailable()` deve ser feita com cache curto ou no momento da chamada (sem cache para simplificar na v1)
- **Critério**: `ModelInitializerService` funciona com e sem LiteLLM, sem regressão

### T8 — Atualizar composição no `adGeneratorAgent.ts`

- [x] Em `src/agent/adGeneratorAgent.ts`:
  - [x] Instanciar `LiteLLMProxyProvider` condicionalmente:
    ```typescript
    const liteLLMProvider =
      process.env.LITELLM_PROXY_URL && process.env.LITELLM_API_KEY
        ? new LiteLLMProxyProvider(
            process.env.LITELLM_PROXY_URL,
            process.env.LITELLM_API_KEY,
          )
        : undefined;
    ```
  - [x] Passar `liteLLMProvider` ao `ModelInitializerService`:
    ```typescript
    const modelInitializerService = new ModelInitializerService(
      modelRegistry,
      modelProviderFactory,
      liteLLMProvider,
    );
    ```
- **Critério**: Composição atualizada, sem quebrar interface pública

### T9 — Testes unitários do `ModelInitializerService` refatorado

- [x] Atualizar/adicionar testes em `src/agent/__tests__/domain/ModelInitializerService.test.ts`:
  - [x] Testar: modelo de texto + LiteLLM disponível → usa `liteLLMProvider.create()`
  - [x] Testar: modelo de texto + LiteLLM indisponível → usa chamada direta (fallback)
  - [x] Testar: modelo de texto + LiteLLM não configurado (undefined) → usa chamada direta
  - [x] Testar: modelo de imagem (`gpt-image-1.5`) + LiteLLM disponível → **não** usa proxy, chamada direta
  - [x] Testar: testes existentes continuam passando (sem regressão)
- **Critério**: Todos os cenários cobertos, sem regressão nos testes existentes

---

## Fase 4 — Validação e Testes de Integração

### T10 — Executar suite de testes completa

- [x] Rodar `pnpm test`
- [x] Todos os testes existentes devem continuar passando
- [x] Novos testes (T6, T9) devem passar
- [x] Nenhuma regressão em:
  - Testes do agente (`adGeneratorAgent.test.ts`)
  - Testes de domain (`__tests__/domain/`)
  - Testes de application (`__tests__/application/`)
  - Testes da rota (`route.test.ts`)
- **Critério**: `pnpm test` — todas as suites verdes, 0 falhas

### T11 — Validar TypeScript

- [x] Executar `npx tsc --noEmit`
- [x] Resultado: 0 erros, 0 warnings
- **Critério**: Compilação limpa

### T12 — Teste manual end-to-end com LiteLLM

- [x] Subir infra: `docker compose up -d`
- [x] Verificar que LiteLLM está saudável: `curl http://localhost:4000/health`
- [x] Fazer `POST /api/agent/generate` com `model: "gpt-4o-mini"` → anúncio gerado via LiteLLM
- [x] Verificar nos logs do LiteLLM que a chamada passou pelo proxy
- [x] (Opcional) Simular falha de cota no modelo primário e verificar fallback nos logs
- **Critério**: Anúncio gerado com sucesso via LiteLLM proxy

### T13 — Teste manual de degradação graciosa

- [x] Derrubar apenas o LiteLLM: `docker compose stop litellm`
- [x] Fazer `POST /api/agent/generate` com `model: "gpt-4o-mini"` → anúncio gerado via chamada direta
- [x] Verificar que não houve erro visível para o usuário
- **Critério**: Agente funciona normalmente sem o LiteLLM

---

## Fase 5 — Documentação e Finalização

### T14 — Atualizar documentação

- [x] Marcar critérios de aceitação em `openspec/specs/litellm-model-fallback.md` como `[x]`
- [x] Marcar todas as tasks T1-T14 neste arquivo como `[x]`
- [x] Adicionar seção "Status de Implementação" com data na spec
- **Critério**: Documentação 100% atualizada

---

## Ordem de Execução Sugerida

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14
```

## Dependências entre Tasks

```
T1 ──▶ T2 (config antes do docker-compose)
T3 (independente, pode paralelo com T1-T2)
T4 ──▶ T5 (interface antes da implementação)
T5 ──▶ T6 (implementação antes dos testes)
T5 ──▶ T7 (provider antes da refatoração do service)
T7 ──▶ T8 (service antes da composição)
T6 + T9 ──▶ T10 (testes unitários antes da suite completa)
T10 ──▶ T11 (testes antes do type-check)
T2 + T8 ──▶ T12 (infra + código antes do teste e2e)
T12 ──▶ T13 (e2e antes do teste de degradação)
T13 ──▶ T14 (tudo pronto antes de documentar)
```

## Estimativa de Complexidade

| Task | Complexidade | Descrição                             |
| ---- | ------------ | ------------------------------------- |
| T1   | Baixa        | Criar config YAML                     |
| T2   | Baixa        | Adicionar serviço ao docker-compose   |
| T3   | Baixa        | Atualizar .env.local.example          |
| T4   | Baixa        | Criar interface                       |
| T5   | Média        | Implementar provider com health check |
| T6   | Média        | Testes do provider                    |
| T7   | Alta         | Refatorar ModelInitializerService     |
| T8   | Baixa        | Atualizar composição                  |
| T9   | Média        | Testes do service refatorado          |
| T10  | Baixa        | Rodar suite completa                  |
| T11  | Baixa        | Validar TypeScript                    |
| T12  | Média        | Teste manual e2e                      |
| T13  | Baixa        | Teste de degradação                   |
| T14  | Baixa        | Documentação                          |
