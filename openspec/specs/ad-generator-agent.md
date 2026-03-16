# Spec: Ad Generator Agent

## Visão Geral

Serviço de IA que recebe um input do usuário descrevendo um produto/serviço e retorna um anúncio gerado automaticamente em formato Markdown, seguindo as regras definidas em um manual de instruções.

## Objetivo

Criar um agente LangGraph que funcione como serviço stateless:

1. Recebe um input do usuário (descrição do produto/serviço)
2. Consulta o manual de instruções (regras de geração de anúncio)
3. Gera e retorna o anúncio em Markdown por streaming (token a token)

## Critérios de Aceitação

- [ ] O agente aceita um input em texto livre descrevendo o produto/serviço
- [ ] O agente carrega o manual de instruções antes de gerar o anúncio
- [ ] O anúncio gerado segue as regras do manual (tom, estrutura, tamanho)
- [ ] O retorno é sempre em formato Markdown válido
- [ ] A API expõe um endpoint `POST /api/agent/generate` que recebe JSON e responde via stream SSE
- [ ] O endpoint responde em menos de 30 segundos
- [ ] Erros retornam mensagens claras com status HTTP adequado

## Contrato da API

### Request

```http
POST /api/agent/generate
Content-Type: application/json

{
  "input": "Tênis casual masculino, cor azul, solado de borracha, R$199"
}
```

### Response (sucesso - streaming)

```http
HTTP 200 OK
Content-Type: text/event-stream

data: {"type":"token","content":"# Tênis Casual Masculino Azul"}

data: {"type":"token","content":"\n\n**Conforto e estilo para o dia a dia**"}

data: {"type":"done","metadata":{"model":"gpt-4o-mini","generatedAt":"2026-03-16T10:00:00Z"}}
```

### Response (erro)

```http
HTTP 400 Bad Request

{
  "error": "O campo 'input' é obrigatório e não pode estar vazio."
}
```

## Estrutura do Anúncio (definida no manual)

O manual de instruções (`/src/agent/instructions.md`) deve definir:

- Título (H1)
- Subtítulo destacando benefício principal
- Seção de destaques (lista com 3-5 bullets)
- Chamada para ação (CTA)
- Tom: persuasivo, direto, positivo

## Arquitetura

```
POST /api/agent/generate
       │
       ▼
  Route Handler (Next.js)
       │
       ▼
  AdGeneratorAgent (LangGraph)
    ┌──────────────────────────┐
    │  [load_instructions]     │ ← lê o manual de instruções
    │  [generate_ad]           │ ← LLM gera o anúncio em Markdown
    │  [validate_output]       │ ← valida se o output é Markdown válido
    └──────────────────────────┘
       │
       ▼
  Retorna stream SSE (tokens + metadata final)
```

## Tech Stack

- **Framework**: Next.js (App Router)
- **Agent**: LangGraph (`@langchain/langgraph`)
- **LLM**: OpenAI `gpt-4o-mini` via `@langchain/openai`
- **Linguagem**: TypeScript
- **Testes**: Jest + supertest

## Restrições

- O manual de instruções é um arquivo estático em `/src/agent/instructions.md`
- O agente é stateless (sem histórico de conversa entre chamadas)
- Não há autenticação nesta versão (v1)

## Não incluso nesta versão (v1)

- Histórico de anúncios gerados
- Múltiplos modelos de anúncio
- Interface gráfica
