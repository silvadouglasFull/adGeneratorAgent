# Tasks: Ferramenta de Geração de Imagem (GPT Image 1.5)

Spec de referência: `openspec/specs/image-generation-tool.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Domain e State

### T1 — Atualizar SupportedModel e ModelRegistry

- [x] Adicionar `"gpt-image-1.5"` ao array `SUPPORTED_MODELS` em `SupportedModel.ts`
- [x] Adicionar configuração de `"gpt-image-1.5"` no `ModelRegistry.default()` com provider `"openai"`
- [x] Atualizar `ModelConfig` se necessário para suportar modelos de imagem
- [x] Atualizar testes de `SupportedModel.test.ts` e `ModelRegistry.test.ts`
- **Critério**: `isSupportedModel("gpt-image-1.5")` retorna `true`, testes passam

### T2 — Atualizar AgentState

- [x] Adicionar campos ao `AgentStateDefinition.ts`:
  - `shouldGenerateImage: boolean` — indica se o usuário pediu imagem
  - `imagePrompt: string` — prompt técnico em inglês para gerar a imagem
  - `imageUrl: string` — base64 ou URL da imagem gerada
- [x] Manter campos existentes intactos (`input`, `model`, `instructions`, `ad`)
- **Critério**: AgentState compila com novos campos opcionais

### T3 — Criar prompt de imagem (ImagePromptTemplate)

- [x] Criar arquivo `src/agent/imagePrompt.ts`
- [x] Definir `ChatPromptTemplate` com a persona de Diretor de Arte Imobiliário 2026 (conforme spec)
- [x] O prompt recebe `{input}` do usuário e retorna prompt técnico em inglês para geração de imagem
- [x] Exportar como `imageDirectorPrompt`
- **Critério**: prompt compila e é invocável com `{ input: string }`

---

## Fase 2 — Services de Domínio

### T4 — Criar ImagePromptService

- [x] Criar `src/agent/domain/service/ImagePromptService.ts`
- [x] Responsabilidade: usar o modelo de texto do usuário para gerar prompt técnico de imagem em inglês
- [x] Receber `input` do usuário + `model` selecionado + `imageDirectorPrompt`
- [x] Retornar string com prompt técnico em inglês
- [x] Criar testes em `src/agent/__tests__/domain/ImagePromptService.test.ts`
- **Critério**: service gera prompt de imagem a partir do input do usuário

### T5 — Criar ImageGenerationService

- [x] Criar `src/agent/domain/service/ImageGenerationService.ts`
- [x] Responsabilidade: chamar API da OpenAI para gerar imagem com modelo `gpt-image-1.5`
- [x] Usar `OPENAI_API_KEY` do ambiente
- [x] Enviar prompt técnico em inglês recebido do `ImagePromptService`
- [x] Retornar `{ imageUrl: string, usage: { inputTokens, outputTokens } }`
- [x] Tratar erros (timeout 60s, API indisponível) lançando exceção de domínio
- [x] Criar testes em `src/agent/__tests__/domain/ImageGenerationService.test.ts`
- **Critério**: service retorna imagem (base64/URL) + usage, mock da API nos testes

### T6 — Criar serviço de detecção de intenção de imagem

- [x] Criar `src/agent/domain/service/ImageIntentDetector.ts`
- [x] Responsabilidade: analisar o input do usuário e retornar `boolean` indicando se há pedido de imagem
- [x] Usar heurística baseada em palavras-chave (ex: "imagem", "foto", "visual", "gere uma imagem", "image")
- [x] Criar testes em `src/agent/__tests__/domain/ImageIntentDetector.test.ts`
- [x] Cobrir: intenção positiva, negativa, casos ambíguos
- **Critério**: detector retorna `true` para inputs com pedido de imagem, `false` caso contrário

---

## Fase 3 — Grafo (Application Layer)

### T7 — Adicionar nós de imagem ao grafo LangGraph

- [x] Em `AdGeneratorGraphBuilder.ts`:
  - [x] Adicionar nó `detectImageIntent`: chama `ImageIntentDetector`, seta `shouldGenerateImage` no state
  - [x] Adicionar nó `generateImagePrompt`: chama `ImagePromptService` quando `shouldGenerateImage === true`
  - [x] Adicionar nó `generateImage`: chama `ImageGenerationService`, seta `imageUrl` no state
  - [x] Adicionar roteamento condicional após `detectImageIntent`:
    - Se `shouldGenerateImage === true`: segue para `generateImagePrompt` → `generateImage` → END
    - Se `shouldGenerateImage === false`: segue direto para END
  - [x] O nó `detectImageIntent` é executado após `validateOutput` (texto já gerado)
- [x] Atualizar fluxo: `loadInstructions → generateAd → validateOutput → detectImageIntent → (condicional)`
- [x] Criar/atualizar testes em `src/agent/__tests__/application/AdGeneratorGraphBuilder.test.ts`
- **Critério**: grafo executa com e sem imagem, compilação sem erros

### T8 — Atualizar AdStreamGenerator para emitir imagem

- [x] Atualizar `AdStreamGenerator.ts`:
  - [x] Capturar estado final do grafo incluindo `imageUrl`
  - [x] Rastrear token usage do nó `generateImage` separadamente
  - [x] Retornar `imageUrl` e `imageUsage` no resultado final do generator
- [x] Atualizar tipo `TokenUsage` ou criar `ImageGenerationResult`
- [x] Atualizar testes em `src/agent/__tests__/application/AdStreamGenerator.test.ts`
- **Critério**: stream retorna `imageUrl` quando imagem foi gerada, `undefined` quando não

---

## Fase 4 — API Route

### T9 — Atualizar route handler para emitir evento de imagem

- [x] Em `src/app/api/agent/generate/route.ts`:
  - [x] Após stream de texto, verificar se `imageUrl` está presente no resultado
  - [x] Se sim, emitir evento SSE: `data: {"type":"image","imageUrl":"..."}`
  - [x] Incluir `imageModel` e `imageUsage` no evento `done`
  - [x] Registrar consumo de tokens da imagem como **segundo** `TokenConsumptionEvent` com `modelUsed: "gpt-image-1.5"`
- [x] Manter fluxo sem imagem inalterado
- [x] Atualizar testes em `src/app/api/agent/generate/__tests__/route.test.ts`
  - [x] Testar: input com pedido de imagem → evento `image` + evento `done` com `imageModel`
  - [x] Testar: input sem pedido de imagem → sem evento `image`
  - [x] Testar: registro separado de tokens de imagem
- **Critério**: rota emite evento `image` quando solicitado, registra tokens separadamente

---

## Fase 5 — Frontend

### T10 — Criar componente AdImagePreview

- [x] Criar `src/components/AdImagePreview.tsx`
- [x] Aceitar props: `imageUrl: string | null`
- [x] Renderizar imagem com bordas arredondadas e responsividade
- [x] Exibir placeholder/skeleton enquanto imagem não chegou (se loading)
- [x] Não renderizar nada se `imageUrl` for `null`
- **Critério**: componente exibe imagem quando presente, nada quando ausente

### T11 — Integrar componente na página principal

- [x] Atualizar `src/app/page.tsx`:
  - [x] Adicionar estado `imageUrl` ao componente
  - [x] Processar evento SSE `type: "image"` no loop de leitura do stream
  - [x] Renderizar `AdImagePreview` acima do `AdPreview` (imagem em cima, texto em baixo)
  - [x] Incluir `imageModel` no metadata exibido
- [x] Manter comportamento existente para fluxo sem imagem
- **Critério**: imagem aparece acima do texto na UI quando gerada

---

## Fase 6 — Qualidade e Validação

### T12 — Atualizar facade do agente

- [x] Em `adGeneratorAgent.ts`:
  - [x] Injetar novos services (`ImageIntentDetector`, `ImagePromptService`, `ImageGenerationService`)
  - [x] Passar dependências para `AdGeneratorGraphBuilder.build()`
  - [x] Atualizar tipo de retorno de `streamGeneratedAd` para incluir `imageUrl` e `imageUsage`
- [x] Manter interface pública backward-compatible
- **Critério**: facade compila e exporta tipos atualizados

### T13 — Testes e verificação final

- [x] Executar `pnpm test` — todos os testes passam
- [x] Executar `npx tsc --noEmit` — 0 erros
- [ ] Validar manualmente:
  - [ ] Input sem pedido de imagem → fluxo normal (apenas texto)
  - [ ] Input com pedido de imagem → texto + imagem exibidos na UI
  - [ ] Verificar no banco que há 2 registros de token consumption (texto + imagem)
- **Critério**: sem regressões, feature funcional end-to-end

---

## Ordem de Execução Sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13
```

## Estimativa de Complexidade

| Task | Complexidade | Descrição                            |
| ---- | ------------ | ------------------------------------ |
| T1   | Baixa        | Atualizar tipos e registry           |
| T2   | Baixa        | Novos campos no state                |
| T3   | Baixa        | Template de prompt                   |
| T4   | Média        | Service de prompt de imagem          |
| T5   | Alta         | Integração com API de imagem OpenAI  |
| T6   | Baixa        | Detector de intenção (heurística)    |
| T7   | Alta         | Alterar grafo com roteamento         |
| T8   | Média        | Atualizar stream generator           |
| T9   | Média        | Atualizar route com evento de imagem |
| T10  | Baixa        | Componente de preview de imagem      |
| T11  | Média        | Integrar imagem na página            |
| T12  | Média        | Atualizar facade do agente           |
| T13  | Média        | Testes e validação final             |
