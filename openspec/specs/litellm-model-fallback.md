# Spec: LiteLLM Proxy com Fallback Automático de Modelos

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

Status: **Concluído em 18/03/2026**

---

## Visão Geral

Adicionar um container Docker com **LiteLLM Proxy** ao projeto para que o agente de geração de anúncios de texto alterne automaticamente entre os modelos configurados (OpenAI e Gemini) quando os tokens ou a cota de um modelo se esgotam. O LiteLLM atua como proxy OpenAI-compatível, expondo um endpoint único que o LangChain consome via `ChatOpenAI` apontando para o proxy local.

## Problema Atual

O agente usa `ModelInitializerService` para instanciar modelos diretamente (OpenAI ou Gemini). Se a cota de tokens de um modelo acaba (erro 429/quota exceeded), a geração falha por completo. O usuário precisa manualmente trocar o modelo para continuar usando o serviço.

## Objetivo

1. Subir o LiteLLM Proxy como container Docker com fallback configurado entre os modelos de texto disponíveis
2. Refatorar o `ModelInitializerService` para rotear chamadas de texto pelo LiteLLM Proxy quando disponível
3. Manter o comportamento atual como fallback (chamada direta ao provider) quando o LiteLLM não está rodando
4. **Não alterar** o fluxo de geração de imagem (continua usando OpenAI diretamente com `gpt-image-1.5`)
5. Manter compatibilidade com Helicone (proxy Helicone → LiteLLM → provider)

## Escopo

### Incluído

- Container Docker `litellm` no `docker-compose.yml`
- Arquivo de configuração `litellm/config.yaml` com modelos e fallback
- Refatoração do `ModelInitializerService` para suportar roteamento via LiteLLM Proxy
- Classe `LiteLLMProxyProvider` na camada de infraestrutura
- Variáveis de ambiente para controlar ativação do proxy (`LITELLM_PROXY_URL`, `LITELLM_API_KEY`)
- Testes unitários para o novo provider e a lógica de fallback
- Atualização do `.env.local.example` com novas variáveis

### Não incluído

- Geração de imagem via LiteLLM (continua direta na OpenAI)
- Dashboard do LiteLLM (opcionalmente expor a porta da UI, mas sem spec de uso)
- Autenticação avançada no LiteLLM (virtual keys, rate limiting por usuário)
- Balanceamento de carga (load balancing entre instâncias do mesmo modelo)

## Regras de Negócio

### RN1 — Fallback automático entre modelos de texto

Quando o modelo primário selecionado pelo usuário retorna erro de cota (429, quota exceeded, rate limit), o LiteLLM deve automaticamente tentar o próximo modelo configurado na lista de fallback. A ordem de fallback deve respeitar:

- Se o usuário selecionou `gpt-4o-mini`: tenta `gpt-4o-mini` → fallback para `gemini-2.0-flash`
- Se o usuário selecionou `gemini-2.0-flash`: tenta `gemini-2.0-flash` → fallback para `gpt-4o-mini`

### RN2 — Modelo de imagem não passa pelo LiteLLM

O modelo `gpt-image-1.5` continua sendo chamado diretamente pela OpenAI API (`ImageGenerationService`). O LiteLLM Proxy é exclusivo para modelos de texto.

### RN3 — Degradação graciosa (graceful degradation)

Se o container LiteLLM não estiver rodando ou não estiver acessível, o agente deve funcionar normalmente usando a chamada direta ao provider (comportamento atual). Isso garante que o LiteLLM é uma melhoria opcional, não uma dependência obrigatória.

### RN4 — Compatibilidade com Helicone

Quando `HELICONE_API_KEY` está presente, as chamadas do LiteLLM devem passar pelo proxy Helicone para manter o tracking de custos. Isso é configurado dentro do `litellm/config.yaml` usando `api_base` para os modelos OpenAI e headers customizados para Helicone.

### RN5 — Transparência para o consumidor

A API pública (`POST /api/agent/generate`) não muda. O campo `model` no request continua sendo o modelo preferido do usuário. O metadata da resposta deve indicar qual modelo efetivamente gerou o texto (pode diferir se houve fallback).

### RN6 — Chave mestra do LiteLLM

O LiteLLM Proxy é protegido por uma `LITELLM_API_KEY` (master key). O `ModelInitializerService` usa essa chave ao conectar-se ao proxy. Essa chave é definida no `.env.local` e passada ao container via `docker-compose.yml`.

## Arquitetura

### Fluxo com LiteLLM ativo

```
Usuário → POST /api/agent/generate
           │
           ▼
    Route Handler (Next.js)
           │
           ▼
    AdGeneratorAgent (LangGraph)
           │
    ┌──────▼──────────────┐
    │  loadInstructions    │
    │  generateAd          │ ← ModelInitializerService
    │  validateOutput      │      │
    └──────────────────────┘      │
                                  ▼
                          LiteLLMProxyProvider
                           (ChatOpenAI → http://localhost:4000)
                                  │
                                  ▼
                          LiteLLM Proxy (Docker)
                           ┌─────────────────────────┐
                           │ Tenta modelo primário    │
                           │ (ex: gpt-4o-mini)        │
                           │         │                │
                           │    Erro 429?             │
                           │    ┌────▼────┐           │
                           │    │ Fallback│           │
                           │    │ gemini  │           │
                           │    └─────────┘           │
                           └─────────────────────────┘
                                  │
                                  ▼
                          Provider real (OpenAI / Google)
```

### Fluxo sem LiteLLM (fallback gracioso)

```
    ModelInitializerService
           │
           ▼
    LiteLLM acessível? ─── NÃO ───▶ Chamada direta ao provider (comportamento atual)
           │
          SIM
           │
           ▼
    ChatOpenAI → LiteLLM Proxy → Provider real
```

## Configuração do LiteLLM

### Arquivo `litellm/config.yaml`

```yaml
model_list:
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gemini-2.0-flash
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GENAI_API

litellm_settings:
  fallbacks:
    - gpt-4o-mini: ["gemini-2.0-flash"]
    - gemini-2.0-flash: ["gpt-4o-mini"]
  num_retries: 1
  request_timeout: 30

general_settings:
  master_key: os.environ/LITELLM_API_KEY
```

### Docker Compose (adição)

```yaml
litellm:
  image: ghcr.io/berriai/litellm:main-latest
  container_name: ad-generator-litellm
  restart: unless-stopped
  ports:
    - "${LITELLM_PORT:-4000}:4000"
  volumes:
    - ./litellm/config.yaml:/app/config.yaml
  environment:
    OPENAI_API_KEY: ${OPENAI_API_KEY}
    GENAI_API: ${GENAI_API}
    LITELLM_API_KEY: ${LITELLM_API_KEY}
  command: ["--config", "/app/config.yaml", "--port", "4000"]
  healthcheck:
    test:
      [
        "CMD-SHELL",
        'python -c "import os,urllib.request; req=urllib.request.Request(''http://localhost:4000/health'', headers={''Authorization'': ''Bearer '' + os.getenv(''LITELLM_API_KEY'','''')}); urllib.request.urlopen(req, timeout=3)" || exit 1',
      ]
    interval: 15s
    timeout: 5s
    retries: 5
    start_period: 20s
```

## Mudanças no Código

### 1. Nova classe: `LiteLLMProxyProvider` (infrastructure)

```
src/agent/infrastructure/providers/LiteLLMProxyProvider.ts
```

Responsabilidade: criar uma instância `ChatOpenAI` do LangChain apontando para o endpoint do LiteLLM Proxy. O LiteLLM expõe uma API compatível com OpenAI, então o LangChain se conecta via `ChatOpenAI` com `baseURL` customizada.

```typescript
// Pseudo-código da interface
class LiteLLMProxyProvider {
  constructor(proxyUrl: string, apiKey: string);
  create(model: SupportedModel, options?: ModelProviderOptions): BaseChatModel;
  isAvailable(): Promise<boolean>;
}
```

- `create()` retorna um `ChatOpenAI` com `configuration.baseURL` apontando para o LiteLLM
- `isAvailable()` faz um health check (`GET /health`) no proxy
- Headers Helicone são passados quando `HELICONE_API_KEY` está presente

### 2. Refatoração: `ModelInitializerService`

Adicionar instância opcional de `LiteLLMProxyProvider`. Lógica de inicialização:

1. Se `modelName` é modelo de imagem (`gpt-image-1.5`) → chamada direta (sem proxy)
2. Se `LiteLLMProxyProvider` existe e `isAvailable()` → usa o proxy
3. Senão → usa `ModelProviderFactory` ou chamada direta (comportamento atual)

### 3. Atualização: `ModelConfig` e `ModelRegistry`

Nenhuma mudança necessária. O `ModelRegistry` continua servindo as configurações de provider para o fallback direto. O LiteLLM gerencia seu próprio mapeamento internamente.

### 4. Variáveis de ambiente (novas)

| Variável            | Descrição                                      | Exemplo                 |
| ------------------- | ---------------------------------------------- | ----------------------- |
| `LITELLM_PROXY_URL` | URL base do LiteLLM Proxy                      | `http://localhost:4000` |
| `LITELLM_API_KEY`   | Master key do LiteLLM                          | `sk-litellm-master-key` |
| `LITELLM_PORT`      | Porta exposta no host (opcional, default 4000) | `4000`                  |

## Contrato da API

### Sem mudanças no request

```http
POST /api/agent/generate
Content-Type: application/json

{
  "input": "Apartamento 3 quartos em Florianópolis",
  "model": "gpt-4o-mini"
}
```

### Response — campo `model` no metadata pode diferir do solicitado

```json
{
  "type": "done",
  "metadata": {
    "model": "gpt-4o-mini",
    "actualModel": "gemini-2.0-flash",
    "generatedAt": "2026-03-18T12:00:00Z",
    "fallbackUsed": true
  }
}
```

- `model`: modelo solicitado pelo usuário
- `actualModel`: modelo que efetivamente gerou o texto (pode diferir se houve fallback)
- `fallbackUsed`: `true` se o LiteLLM usou um modelo diferente do solicitado

> Nota: a detecção de `actualModel` depende dos headers de resposta do LiteLLM (`x-litellm-model-id`). Se não disponível, `actualModel` será igual a `model`.

## Critérios de Aceitação

- [x] Container `litellm` configurado no `docker-compose.yml` e sobe com `docker compose up`
- [x] Arquivo `litellm/config.yaml` configura `gpt-4o-mini` e `gemini-2.0-flash` com fallback bidirecional
- [x] `LiteLLMProxyProvider` cria instância `ChatOpenAI` apontando para o proxy
- [x] `LiteLLMProxyProvider.isAvailable()` valida health check do proxy
- [x] `ModelInitializerService` usa o proxy para modelos de texto quando disponível
- [x] `ModelInitializerService` ignora o proxy para modelo de imagem (`gpt-image-1.5`)
- [x] Quando LiteLLM está offline, o agente funciona normalmente (chamada direta ao provider)
- [x] Variáveis `LITELLM_PROXY_URL`, `LITELLM_API_KEY`, `LITELLM_PORT` documentadas no `.env.local.example`
- [x] `pnpm test` passa com todos os testes existentes + novos
- [x] `npx tsc --noEmit` retorna 0 erros
- [x] Geração de anúncio funciona via LiteLLM com modelo primário
- [x] Fallback funciona quando o modelo primário retorna erro de cota

## Restrições

- O LiteLLM é uma dependência de infraestrutura (Docker), não uma dependência de código (npm)
- O agente não deve ter dependência hard-coded no LiteLLM — sempre deve funcionar sem ele
- A geração de imagem nunca passa pelo LiteLLM
- Não alterar o contrato público da API (apenas adicionar campos opcionais ao metadata)

## Riscos e Mitigações

| Risco                                  | Mitigação                                                           |
| -------------------------------------- | ------------------------------------------------------------------- |
| LiteLLM container instável             | Graceful degradation: fallback para chamada direta                  |
| Latência extra do proxy                | LiteLLM roda localmente, overhead mínimo (~5-15ms)                  |
| Incompatibilidade Helicone + LiteLLM   | Configurar `api_base` do Helicone no LiteLLM config                 |
| Headers de modelo real não disponíveis | Se `actualModel` não detectável, usar modelo solicitado como padrão |

## Dependências Técnicas

| Componente                       | Já existe? | Ação                          |
| -------------------------------- | ---------- | ----------------------------- |
| Docker + Docker Compose          | Sim        | Adicionar serviço `litellm`   |
| `@langchain/openai` (ChatOpenAI) | Sim        | Reusar para conectar ao proxy |
| `ModelInitializerService`        | Sim        | Refatorar para suportar proxy |
| `ModelProviderFactory`           | Sim        | Sem mudanças                  |
| `LiteLLMProxyProvider`           | Não        | Criar                         |
| `litellm/config.yaml`            | Não        | Criar                         |

## Não incluso nesta versão

- Dashboard administrativo do LiteLLM
- Virtual keys por usuário
- Rate limiting customizado por modelo
- Roteamento baseado em custo/latência
- Load balancing entre múltiplas instâncias do mesmo modelo
- Cache de respostas no LiteLLM
