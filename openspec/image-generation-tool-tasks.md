# Tasks: Ferramenta de Geração de Imagem (GPT Image 1.5)

Spec de referência: `openspec/specs/image-generation-tool.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Domain e State

### T1 — Atualizar SupportedModel e ModelRegistry

- [ ] Adicionar `"gpt-image-1.5"` ao array `SUPPORTED_MODELS` em `SupportedModel.ts`
- [ ] Adicionar configuração de `"gpt-image-1.5"` no `ModelRegistry.default()` com provider `"openai"`
- [ ] Atualizar `ModelConfig` se necessário para suportar modelos de imagem
- [ ] Atualizar testes de `SupportedModel.test.ts` e `ModelRegistry.test.ts`
- **Critério**: `isSupportedModel("gpt-image-1.5")` retorna `true`, testes passam

### T2 — Atualizar AgentState

- [ ] Adicionar campos ao `AgentStateDefinition.ts`:
  - `shouldGenerateImage: boolean` — indica se o usuário pediu imagem
  - `imagePrompt: string` — prompt técnico em inglês para gerar a imagem
  - `imageUrl: string` — base64 ou URL da imagem gerada
- [ ] Manter campos existentes intactos (`input`, `model`, `instructions`, `ad`)
- **Critério**: AgentState compila com novos campos opcionais

### T3 — Criar prompt de imagem (ImagePromptTemplate)

- [ ] Criar arquivo `src/agent/imagePrompt.ts`
- [ ] Definir `ChatPromptTemplate` com a persona de Diretor de Arte Imobiliário 2026 (conforme spec)
- [ ] O prompt recebe `{input}` do usuário e retorna prompt técnico em inglês para geração de imagem
- [ ] Exportar como `imageDirectorPrompt`
- **Critério**: prompt compila e é invocável com `{ input: string }`

---

## Fase 2 — Services de Domínio

### T4 — Criar ImagePromptService

- [ ] Criar `src/agent/domain/service/ImagePromptService.ts`
- [ ] Responsabilidade: usar o modelo de texto do usuário para gerar prompt técnico de imagem em inglês
- [ ] Receber `input` do usuário + `model` selecionado + `imageDirectorPrompt`
- [ ] Retornar string com prompt técnico em inglês
- [ ] Criar testes em `src/agent/__tests__/domain/ImagePromptService.test.ts`
- **Critério**: service gera prompt de imagem a partir do input do usuário

### T5 — Criar ImageGenerationService

- [ ] Criar `src/agent/domain/service/ImageGenerationService.ts`
- [ ] Responsabilidade: chamar API da OpenAI para gerar imagem com modelo `gpt-image-1.5`
- [ ] Usar `OPENAI_API_KEY` do ambiente
- [ ] Enviar prompt técnico em inglês recebido do `ImagePromptService`
- [ ] Retornar `{ imageUrl: string, usage: { inputTokens, outputTokens } }`
- [ ] Tratar erros (timeout 60s, API indisponível) lançando exceção de domínio
- [ ] Criar testes em `src/agent/__tests__/domain/ImageGenerationService.test.ts`
- **Critério**: service retorna imagem (base64/URL) + usage, mock da API nos testes

### T6 — Criar serviço de detecção de intenção de imagem

- [ ] Criar `src/agent/domain/service/ImageIntentDetector.ts`
- [ ] Responsabilidade: analisar o input do usuário e retornar `boolean` indicando se há pedido de imagem
- [ ] Usar heurística baseada em palavras-chave (ex: "imagem", "foto", "visual", "gere uma imagem", "image")
- [ ] Criar testes em `src/agent/__tests__/domain/ImageIntentDetector.test.ts`
- [ ] Cobrir: intenção positiva, negativa, casos ambíguos
- **Critério**: detector retorna `true` para inputs com pedido de imagem, `false` caso contrário

---

## Fase 3 — Grafo (Application Layer)

### T7 — Adicionar nós de imagem ao grafo LangGraph

- [ ] Em `AdGeneratorGraphBuilder.ts`:
  - [ ] Adicionar nó `detectImageIntent`: chama `ImageIntentDetector`, seta `shouldGenerateImage` no state
  - [ ] Adicionar nó `generateImagePrompt`: chama `ImagePromptService` quando `shouldGenerateImage === true`
  - [ ] Adicionar nó `generateImage`: chama `ImageGenerationService`, seta `imageUrl` no state
  - [ ] Adicionar roteamento condicional após `detectImageIntent`:
    - Se `shouldGenerateImage === true`: segue para `generateImagePrompt` → `generateImage` → END
    - Se `shouldGenerateImage === false`: segue direto para END
  - [ ] O nó `detectImageIntent` é executado após `validateOutput` (texto já gerado)
- [ ] Atualizar fluxo: `loadInstructions → generateAd → validateOutput → detectImageIntent → (condicional)`
- [ ] Criar/atualizar testes em `src/agent/__tests__/application/AdGeneratorGraphBuilder.test.ts`
- **Critério**: grafo executa com e sem imagem, compilação sem erros

### T8 — Atualizar AdStreamGenerator para emitir imagem

- [ ] Atualizar `AdStreamGenerator.ts`:
  - [ ] Capturar estado final do grafo incluindo `imageUrl`
  - [ ] Rastrear token usage do nó `generateImage` separadamente
  - [ ] Retornar `imageUrl` e `imageUsage` no resultado final do generator
- [ ] Atualizar tipo `TokenUsage` ou criar `ImageGenerationResult`
- [ ] Atualizar testes em `src/agent/__tests__/application/AdStreamGenerator.test.ts`
- **Critério**: stream retorna `imageUrl` quando imagem foi gerada, `undefined` quando não

---

## Fase 4 — API Route

### T9 — Atualizar route handler para emitir evento de imagem

- [ ] Em `src/app/api/agent/generate/route.ts`:
  - [ ] Após stream de texto, verificar se `imageUrl` está presente no resultado
  - [ ] Se sim, emitir evento SSE: `data: {"type":"image","imageUrl":"..."}`
  - [ ] Incluir `imageModel` e `imageUsage` no evento `done`
  - [ ] Registrar consumo de tokens da imagem como **segundo** `TokenConsumptionEvent` com `modelUsed: "gpt-image-1.5"`
- [ ] Manter fluxo sem imagem inalterado
- [ ] Atualizar testes em `src/app/api/agent/generate/__tests__/route.test.ts`
  - [ ] Testar: input com pedido de imagem → evento `image` + evento `done` com `imageModel`
  - [ ] Testar: input sem pedido de imagem → sem evento `image`
  - [ ] Testar: registro separado de tokens de imagem
- **Critério**: rota emite evento `image` quando solicitado, registra tokens separadamente

---

## Fase 5 — Frontend

### T10 — Criar componente AdImagePreview

- [ ] Criar `src/components/AdImagePreview.tsx`
- [ ] Aceitar props: `imageUrl: string | null`
- [ ] Renderizar imagem com bordas arredondadas e responsividade
- [ ] Exibir placeholder/skeleton enquanto imagem não chegou (se loading)
- [ ] Não renderizar nada se `imageUrl` for `null`
- **Critério**: componente exibe imagem quando presente, nada quando ausente

### T11 — Integrar componente na página principal

- [ ] Atualizar `src/app/page.tsx`:
  - [ ] Adicionar estado `imageUrl` ao componente
  - [ ] Processar evento SSE `type: "image"` no loop de leitura do stream
  - [ ] Renderizar `AdImagePreview` acima do `AdPreview` (imagem em cima, texto em baixo)
  - [ ] Incluir `imageModel` no metadata exibido
- [ ] Manter comportamento existente para fluxo sem imagem
- **Critério**: imagem aparece acima do texto na UI quando gerada

---

## Fase 6 — Qualidade e Validação

### T12 — Atualizar facade do agente

- [ ] Em `adGeneratorAgent.ts`:
  - [ ] Injetar novos services (`ImageIntentDetector`, `ImagePromptService`, `ImageGenerationService`)
  - [ ] Passar dependências para `AdGeneratorGraphBuilder.build()`
  - [ ] Atualizar tipo de retorno de `streamGeneratedAd` para incluir `imageUrl` e `imageUsage`
- [ ] Manter interface pública backward-compatible
- **Critério**: facade compila e exporta tipos atualizados

### T13 — Testes e verificação final

- [ ] Executar `pnpm test` — todos os testes passam
- [ ] Executar `npx tsc --noEmit` — 0 erros
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
