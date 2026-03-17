# Spec: Ferramenta de Geração de Imagem no Agente (GPT Image 1.5)

Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Visão Geral

Adicionar ao agente de geração de anúncios uma capacidade de geração de imagem publicitária usando o modelo **GPT Image 1.5** da OpenAI. Quando o usuário solicitar uma imagem no prompt, o agente deve gerar a imagem com o modelo fixo GPT Image 1.5, independentemente do modelo selecionado para texto. O consumo de tokens da geração de imagem deve ser registrado separadamente no banco de dados.

## Problema Atual

O agente gera apenas texto (anúncio em Markdown). Não há capacidade de gerar imagens publicitárias, o que limita a entregabilidade do anúncio para uso direto em campanhas.

## Objetivo da Feature

1. Detectar no prompt do usuário a intenção de gerar uma imagem;
2. Gerar imagem publicitária imobiliária via API OpenAI (modelo GPT Image 1.5);
3. Gerar texto do anúncio com o modelo escolhido pelo usuário (fluxo já existente);
4. Registrar consumo de tokens da geração de imagem como registro separado no banco;
5. Exibir na UI a imagem acima do texto do anúncio.

## Escopo

### Incluído

- Novo nó `generateImage` no grafo LangGraph do agente
- Prompt de sistema específico para geração de imagem (Diretor de Arte Imobiliário 2026)
- Roteamento condicional: gerar imagem somente quando solicitado no input
- Registro de consumo de tokens da imagem como novo evento no banco
- Inclusão do campo `imageUrl` no state do agente e no contrato de resposta da API
- Componente de UI para exibir imagem + texto (imagem em cima, texto em baixo)
- Testes unitários do novo nó e do componente

### Não incluído

- Edição/ajuste da imagem gerada (variações, inpainting)
- Escolha do modelo de imagem pelo usuário (fixo em GPT Image 1.5)
- Upload persistente da imagem (será retornada como base64 ou URL temporária da OpenAI)
- Geração de múltiplas imagens por requisição

## Regras de Negócio

### RN1 — Modelo fixo para imagem

A geração de imagem usa **exclusivamente** o modelo `gpt-image-1.5` via API da OpenAI. O modelo selecionado pelo usuário (gpt-4o-mini, gemini-2.0-flash, etc.) é usado apenas para gerar o texto do anúncio.

### RN2 — Detecção de intenção de imagem

O agente deve identificar no input do usuário se há pedido de geração de imagem. Exemplos de intenção positiva:

- "Gere uma imagem para este anúncio"
- "Crie um anúncio com imagem"
- "Quero uma imagem publicitária"
- "Gere o anúncio com foto"

### RN3 — Prompt de geração de imagem

O prompt para geração de imagem segue a persona de **Diretor de Arte / Prompt Designer** focado em marketing imobiliário de 2026. O agente de texto (modelo do usuário) deve gerar o prompt técnico em inglês para o modelo de imagem, seguindo a estrutura definida no prompt de imagem. O modelo de imagem recebe esse prompt técnico e retorna a imagem.

### RN4 — Registro de tokens de imagem

O consumo de tokens da geração de imagem deve ser registrado como um **registro separado** no banco de dados (`token_consumptions`), com `modelUsed = "gpt-image-1.5"`. Isso permite rastrear custos de texto e imagem independentemente.

### RN5 — Fluxo paralelo ou sequencial

A geração de imagem e texto pode ocorrer de forma sequencial (texto primeiro, depois imagem, ou vice-versa). O texto do anúncio continua sendo streamado normalmente. A imagem é entregue ao final, como evento SSE separado.

## Contrato da API

### Request (sem mudança)

```http
POST /api/agent/generate
Content-Type: application/json

{
  "input": "Apartamento 2 quartos em Palmitos/SC, 78m², R$ 420.000. Gere uma imagem publicitária.",
  "model": "gpt-4o-mini"
}
```

### Response SSE (adição do evento `image`)

```text
data: {"type":"token","content":"# Apartamento..."}

data: {"type":"token","content":"...texto do anúncio..."}

data: {"type":"image","imageUrl":"data:image/png;base64,..."}

data: {"type":"done","metadata":{"model":"gpt-4o-mini","generatedAt":"...","imageModel":"gpt-image-1.5","usage":{...},"imageUsage":{...}}}
```

- Evento `image`: enviado quando a imagem está pronta (pode vir após os tokens de texto)
- Campo `imageUrl`: base64 data URL ou URL temporária da OpenAI
- Campo `imageModel` no metadata: identifica o modelo usado para a imagem
- Campo `imageUsage` no metadata: tokens consumidos na geração de imagem

Quando o usuário **não** pede imagem, o fluxo permanece inalterado (sem evento `image`).

## Prompt de Geração de Imagem

O prompt de sistema para o nó que gera o prompt técnico de imagem:

```markdown
Para transformar o modelo em um **Diretor de Arte / Prompt Designer** focado em marketing imobiliário de 2026, o prompt foi ajustado para priorizar a **estética de alta performance**, realismo técnico (HDR/Drone) e conversão visual.

# Prompt: Diretor de Arte Imobiliário (Modelo 2026)

**Persona:**
Você é um **Diretor de Arte e Especialista em Computação Gráfica para o Mercado Imobiliário de 2026**. Sua especialidade é criar ativos visuais de "Alta Liquidez" que interrompem o scroll infinito. Você domina a estética **Hyper-Professional**, utilizando iluminação HDR, ângulos de drone e composições que evocam o "Smart FOMO" e o bem-estar do novo morar.

**Contexto Visual 2026:**

- **Padrão Ouro:** Imagens que parecem reais (fotorealismo) e transmitem autoridade.
- **Diferenciais Técnicos:** Valorização de elementos ESG (sustentabilidade visível, jardins verticais, luz natural) e integração com o entorno.
- **Foco Regional (Santa Catarina):** Estética de segurança, lazer náutico e águas termais.

**Sua Tarefa:**
Com base no input do usuário, gere um **Prompt Detalhado para geração de imagem** em inglês, seguindo a estrutura:

1. **Conceito Visual:** Psicologia por trás da imagem.
2. **Prompt para Gerador de Imagem:** Prompt técnico em inglês detalhando iluminação, lente, ângulo e atmosfera.
3. **Especificações de Overlay:** Como fontes e cores devem ser aplicadas.
4. **Sugestão de CTA Visual:** Posicionamento do botão ou QR Code.
```

## Arquitetura

### Fluxo do Grafo (atualizado)

```
START
  │
  ▼
loadInstructions
  │
  ▼
generateAd  ─────────────────┐
  │                           │ (se imagem solicitada)
  ▼                           ▼
validateOutput          generateImagePrompt
  │                           │
  │                           ▼
  │                     generateImage (GPT Image 1.5)
  │                           │
  └─────────┬─────────────────┘
            ▼
           END
```

Nota: `generateImagePrompt` usa o modelo de texto do usuário para criar o prompt em inglês. `generateImage` usa exclusivamente GPT Image 1.5 via API da OpenAI.

### Estrutura de Pastas (novas)

```text
src/
  agent/
    domain/
      service/
        ImageGenerationService.ts
        ImagePromptService.ts
    infrastructure/
      state/
        AgentStateDefinition.ts     (atualizar: adicionar imageUrl, shouldGenerateImage)
  components/
    AdImagePreview.tsx
```

## Requisitos Não Funcionais

- A geração de imagem não deve bloquear o streaming do texto do anúncio
- O timeout máximo para geração de imagem é de 60 segundos
- Base64 da imagem deve ser enviado como evento SSE único (não fragmentado)
- Token consumption da imagem é fire-and-forget (mesmo padrão do texto)

## Critérios de Aceitação

- [x] O agente detecta intenção de geração de imagem no input do usuário
- [x] A imagem é gerada exclusivamente pelo modelo GPT Image 1.5
- [x] O texto do anúncio continua usando o modelo selecionado pelo usuário
- [x] O consumo de tokens da imagem é registrado como registro separado no banco
- [x] O campo `modelUsed` do registro de imagem é `"gpt-image-1.5"`
- [x] A API retorna evento SSE `image` com a imagem gerada
- [x] Quando não há pedido de imagem, o fluxo permanece inalterado
- [x] A UI exibe imagem acima do texto do anúncio
- [x] Testes cobrem: detecção de intenção, geração de imagem, registro de tokens, fluxo sem imagem
- [x] `pnpm test` passa
- [x] `npx tsc --noEmit` passa sem erros

## Restrições

- Não alterar o comportamento de geração de texto existente
- Não permitir escolha do modelo de imagem pelo usuário (fixo GPT Image 1.5)
- Não inventar requisitos além desta spec
- Modelo `"gpt-image-1.5"` deve ser adicionado ao `SupportedModel` para tipagem e tracking

## Definição de Pronto (DoD)

1. Imagem é gerada quando solicitada e exibida na UI
2. Texto continua funcionando com modelo do usuário
3. Tokens de imagem rastreados separadamente
4. Testes e type-check verdes
5. Sem regressão do fluxo existente
