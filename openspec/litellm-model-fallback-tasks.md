# Tasks: LiteLLM Proxy com Fallback Automático de Modelos

Spec de referência: `openspec/specs/litellm-model-fallback.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Infraestrutura Docker

### T1 — Criar arquivo de configuração do LiteLLM

- [ ] Criar diretório `litellm/` na raiz do projeto
- [ ] Criar `litellm/config.yaml` com:
  - [ ] `model_list` com `gpt-4o-mini` (provider `openai`) e `gemini-2.0-flash` (provider `gemini`)
  - [ ] Cada modelo referencia API key via `os.environ/` (ex: `os.environ/OPENAI_API_KEY`, `os.environ/GENAI_API`)
  - [ ] `litellm_settings.fallbacks` com fallback bidirecional:
    - `gpt-4o-mini` → `["gemini-2.0-flash"]`
    - `gemini-2.0-flash` → `["gpt-4o-mini"]`
  - [ ] `litellm_settings.num_retries: 1`
  - [ ] `litellm_settings.request_timeout: 30`
  - [ ] `general_settings.master_key` via `os.environ/LITELLM_API_KEY`
- **Critério**: Arquivo YAML válido, referências de env vars corretas

### T2 — Adicionar serviço LiteLLM ao docker-compose.yml

- [ ] Adicionar serviço `litellm` ao `docker-compose.yml`:
  - [ ] Imagem: `ghcr.io/berriai/litellm:main-latest`
  - [ ] Container name: `ad-generator-litellm`
  - [ ] Porta: `${LITELLM_PORT:-4000}:4000`
  - [ ] Volume: `./litellm/config.yaml:/app/config.yaml`
  - [ ] Variáveis de ambiente: `OPENAI_API_KEY`, `GENAI_API`, `LITELLM_API_KEY`
  - [ ] Command: `["--config", "/app/config.yaml", "--port", "4000"]`
  - [ ] Healthcheck com `curl -f http://localhost:4000/health`
  - [ ] Restart policy: `unless-stopped`
- [ ] Validar que `docker compose up litellm` sobe sem erros
- **Critério**: Container inicia, healthcheck passa, `GET http://localhost:4000/health` retorna 200

### T3 — Atualizar variáveis de ambiente

- [ ] Adicionar ao `.env.local.example`:
  - `LITELLM_PROXY_URL=http://localhost:4000`
  - `LITELLM_API_KEY=sk-litellm-master-key`
  - `LITELLM_PORT=4000`
- **Critério**: `.env.local.example` documenta todas as novas variáveis

---

## Fase 2 — Infraestrutura de Código (Provider)

### T4 — Criar interface `ILiteLLMProxyProvider`

- [ ] Criar `src/agent/domain/service/ILiteLLMProxyProvider.ts`
- [ ] Definir interface:
  ```typescript
  interface ILiteLLMProxyProvider {
    create(
      model: SupportedModel,
      options?: ModelProviderOptions,
    ): BaseChatModel;
    isAvailable(): Promise<boolean>;
  }
  ```
- [ ] A interface segue ISP (Interface Segregation) — apenas o necessário
- **Critério**: Interface compilável, sem dependência de infraestrutura

### T5 — Implementar `LiteLLMProxyProvider`

- [ ] Criar `src/agent/infrastructure/providers/LiteLLMProxyProvider.ts`
- [ ] Implementar `ILiteLLMProxyProvider`
- [ ] Construtor recebe `proxyUrl: string` e `apiKey: string`
- [ ] Método `create(model, options?)`:
  - [ ] Retorna `ChatOpenAI` do `@langchain/openai` com:
    - `model` = nome do modelo solicitado (LiteLLM roteia internamente)
    - `configuration.baseURL` = `this.proxyUrl` (ex: `http://localhost:4000/v1`)
    - `apiKey` = `this.apiKey` (master key do LiteLLM)
    - `temperature: 0.7`, `maxRetries: 0`
  - [ ] Se `options?.heliconeRequestId` presente, adicionar header `Helicone-Request-Id`
- [ ] Método `isAvailable()`:
  - [ ] Faz `fetch(${this.proxyUrl}/health)` com timeout de 2 segundos
  - [ ] Retorna `true` se status 200, `false` caso contrário
  - [ ] Captura qualquer erro de rede e retorna `false` (sem lançar exceção)
- **Critério**: Classe instanciável, `create()` retorna `BaseChatModel`, `isAvailable()` funciona

### T6 — Testes unitários do `LiteLLMProxyProvider`

- [ ] Criar `src/agent/__tests__/infrastructure/LiteLLMProxyProvider.test.ts`
- [ ] Testar `create()`: retorna instância de `ChatOpenAI` com `baseURL` correto
- [ ] Testar `create()`: passa modelo correto para o `ChatOpenAI`
- [ ] Testar `isAvailable()`: retorna `true` quando health endpoint responde 200
- [ ] Testar `isAvailable()`: retorna `false` quando health endpoint falha
- [ ] Testar `isAvailable()`: retorna `false` quando fetch lança erro de rede
- **Critério**: 5 testes passando, mock de `fetch` e `ChatOpenAI`

---

## Fase 3 — Refatoração do ModelInitializerService

### T7 — Refatorar `ModelInitializerService` para suportar LiteLLM Proxy

- [ ] Em `src/agent/domain/service/ModelInitializerService.ts`:
  - [ ] Adicionar parâmetro opcional `liteLLMProvider?: ILiteLLMProxyProvider` no construtor
  - [ ] Alterar método `initialize()`:
    1. Se `modelName` é modelo de imagem (`gpt-image-1.5` ou provider `openai-image`) → chamada direta (sem proxy), comportamento atual
    2. Se `liteLLMProvider` existe e `await liteLLMProvider.isAvailable()` → usar `liteLLMProvider.create(modelName, options)`
    3. Senão → comportamento atual (modelProviderFactory ou chamada direta)
  - [ ] A checagem de `isAvailable()` deve ser feita com cache curto ou no momento da chamada (sem cache para simplificar na v1)
- **Critério**: `ModelInitializerService` funciona com e sem LiteLLM, sem regressão

### T8 — Atualizar composição no `adGeneratorAgent.ts`

- [ ] Em `src/agent/adGeneratorAgent.ts`:
  - [ ] Instanciar `LiteLLMProxyProvider` condicionalmente:
    ```typescript
    const liteLLMProvider =
      process.env.LITELLM_PROXY_URL && process.env.LITELLM_API_KEY
        ? new LiteLLMProxyProvider(
            process.env.LITELLM_PROXY_URL,
            process.env.LITELLM_API_KEY,
          )
        : undefined;
    ```
  - [ ] Passar `liteLLMProvider` ao `ModelInitializerService`:
    ```typescript
    const modelInitializerService = new ModelInitializerService(
      modelRegistry,
      modelProviderFactory,
      liteLLMProvider,
    );
    ```
- **Critério**: Composição atualizada, sem quebrar interface pública

### T9 — Testes unitários do `ModelInitializerService` refatorado

- [ ] Atualizar/adicionar testes em `src/agent/__tests__/domain/ModelInitializerService.test.ts`:
  - [ ] Testar: modelo de texto + LiteLLM disponível → usa `liteLLMProvider.create()`
  - [ ] Testar: modelo de texto + LiteLLM indisponível → usa chamada direta (fallback)
  - [ ] Testar: modelo de texto + LiteLLM não configurado (undefined) → usa chamada direta
  - [ ] Testar: modelo de imagem (`gpt-image-1.5`) + LiteLLM disponível → **não** usa proxy, chamada direta
  - [ ] Testar: testes existentes continuam passando (sem regressão)
- **Critério**: Todos os cenários cobertos, sem regressão nos testes existentes

---

## Fase 4 — Validação e Testes de Integração

### T10 — Executar suite de testes completa

- [ ] Rodar `pnpm test`
- [ ] Todos os testes existentes devem continuar passando
- [ ] Novos testes (T6, T9) devem passar
- [ ] Nenhuma regressão em:
  - Testes do agente (`adGeneratorAgent.test.ts`)
  - Testes de domain (`__tests__/domain/`)
  - Testes de application (`__tests__/application/`)
  - Testes da rota (`route.test.ts`)
- **Critério**: `pnpm test` — todas as suites verdes, 0 falhas

### T11 — Validar TypeScript

- [ ] Executar `npx tsc --noEmit`
- [ ] Resultado: 0 erros, 0 warnings
- **Critério**: Compilação limpa

### T12 — Teste manual end-to-end com LiteLLM

- [ ] Subir infra: `docker compose up -d`
- [ ] Verificar que LiteLLM está saudável: `curl http://localhost:4000/health`
- [ ] Fazer `POST /api/agent/generate` com `model: "gpt-4o-mini"` → anúncio gerado via LiteLLM
- [ ] Verificar nos logs do LiteLLM que a chamada passou pelo proxy
- [ ] (Opcional) Simular falha de cota no modelo primário e verificar fallback nos logs
- **Critério**: Anúncio gerado com sucesso via LiteLLM proxy

### T13 — Teste manual de degradação graciosa

- [ ] Derrubar apenas o LiteLLM: `docker compose stop litellm`
- [ ] Fazer `POST /api/agent/generate` com `model: "gpt-4o-mini"` → anúncio gerado via chamada direta
- [ ] Verificar que não houve erro visível para o usuário
- **Critério**: Agente funciona normalmente sem o LiteLLM

---

## Fase 5 — Documentação e Finalização

### T14 — Atualizar documentação

- [ ] Marcar critérios de aceitação em `openspec/specs/litellm-model-fallback.md` como `[x]`
- [ ] Marcar todas as tasks T1-T14 neste arquivo como `[x]`
- [ ] Adicionar seção "Status de Implementação" com data na spec
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
