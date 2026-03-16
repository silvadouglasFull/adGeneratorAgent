# Spec: Refatoração com Clean Code, SOLID e DDD

Fase anterior: `openspec/specs/init-chat-model.md`

---

## Visão Geral

Refatorar o `adGeneratorAgent` aplicando princípios de **Clean Code**, **SOLID** e **Domain-Driven Design (DDD)** para melhorar legibilidade, manutenção e extensibilidade. O código será reorganizado em classes com nomes sugestivos em arquivos separados, seguindo estrutura de domínio.

## Problemas Atuais

1. **Arquivo monolítico**: `adGeneratorAgent.ts` concentra todas as responsabilidades
   - State management, orchestração, transformações, validações tudo no mesmo arquivo
   - Difícil localizar comportamentos específicos
   - Mudanças em uma área podem impactar tudo

2. **Falta de separação de domínio**: Sem limite claro entre domínios de aplicação
   - Não há abstração clara do "domínio de geração de anúncios"
   - Lógica de modelos misturada com lógica de output

3. **Baixa reutilização**: Funções como `contentToText` não estão em lugar apropriado

4. **Comentários desnecessários**: Alguns blocos de comentários podem ser substituídos por nomenclatura clara

## Solução Proposta: Arquitetura DDD com SOLID

### Estrutura de Pastas

```
src/
├── agent/
│   ├── domain/
│   │   ├── model/
│   │   │   ├── SupportedModel.ts          # Type definition + validation
│   │   │   ├── ModelConfig.ts             # Configuração de modelo
│   │   │   ├── ModelRegistry.ts           # Registry pattern para modelos
│   │   │   └── AdGenerationRequest.ts     # Value Object: entrada
│   │   │
│   │   ├── service/
│   │   │   ├── InstructionService.ts      # Carrega instruções
│   │   │   ├── ModelInitializerService.ts # Inicializa modelo via initChatModel
│   │   │   ├── AdGenerationService.ts     # Orquestra geração de anúncio
│   │   │   └── OutputValidationService.ts # Valida output em Markdown
│   │   │
│   │   └── exception/
│   │       ├── DomainException.ts         # Exceção base do domínio
│   │       ├── ModelNotFoundException.ts
│   │       └── InvalidAdFormatException.ts
│   │
│   ├── application/
│   │   ├── graph/
│   │   │   └── AdGeneratorGraphBuilder.ts # Constrói grafo LangGraph
│   │   │
│   │   └── stream/
│   │       ├── MessageParser.ts           # Parse de mensagens do stream
│   │       └── AdStreamGenerator.ts       # Generator para streaming
│   │
│   ├── infrastructure/
│   │   └── state/
│   │       └── AgentStateDefinition.ts    # Definição Annotation do LangGraph
│   │
│   └── adGeneratorAgent.ts                # Exportações públicas (facade)
│
└── agent/__tests__/
    ├── domain/
    │   ├── ModelRegistry.test.ts
    │   ├── AdGenerationService.test.ts
    │   └── OutputValidationService.test.ts
    │
    └── application/
        ├── AdGeneratorGraphBuilder.test.ts
        └── AdStreamGenerator.test.ts
```

### Princípios SOLID Aplicados

| Princípio                 | Aplicação                                                           |
| ------------------------- | ------------------------------------------------------------------- |
| **S**ingle Responsibility | Cada classe tem uma única responsabilidade bem definida             |
| **O**pen/Closed           | Sistema aberto a extensão (novos modelos) mas fechado a modificação |
| **L**iskov Substitution   | Interfaces e abstrações permitem substituição transparente          |
| **I**nterface Segregation | Classes dependem de interfaces focadas, não "fat" interfaces        |
| **D**ependency Inversion  | Depend de abstrações, não implementações concretas                  |

### Descrição dos Componentes

#### Domain Layer (Núcleo de Negócio)

**`SupportedModel.ts`**

- Type `SupportedModel` com validação
- Guard pattern para validar modelos suportados
- Sem lógica de aplicação, apenas definição de domínio

**`ModelConfig.ts`**

- Value Object representando configuração de um modelo
- Imutável, apenas propriedades
- Sem comportamento, apenas dados

**`ModelRegistry.ts`**

- Registro declarativo de modelos (anteriormente `MODEL_CONFIGS`)
- Método `get(modelName)`: retorna config ou lança `ModelNotFoundException`
- Método `isSupported(modelName)`: valida se modelo existe
- Implementa padrão Registry para extensibilidade

**`AdGenerationRequest.ts`**

- Value Object: entrada para geração de anúncio
- Contém: `input`, `model`, `instructions`
- Validações no construtor (factory com `validate()`)

**`InstructionService.ts`**

- Single responsibility: carregar instruções de arquivo
- Método: `loadInstructions(): Promise<string>`
- Conhece apenas de leitura de arquivo, não de domínio

**`ModelInitializerService.ts`**

- Single responsibility: inicializar modelo
- Método: `initializeModel(modelName, config): Promise<LanguageModel>`
- Encapsula `initChatModel` e tratamento de erros
- Lança `ModelNotFoundException` se modelo inválido

**`AdGenerationService.ts`**

- Orquestra processo de geração
- Coordena: InstructionService, ModelInitializerService, prompt
- Método: `generate(request): Promise<string>`
- Retorna anúncio gerado (sem validação)

**`OutputValidationService.ts`**

- Single responsibility: valida formato Markdown
- Método: `validate(output): Promise<string>`
- Lança `InvalidAdFormatException` se inválido
- Retorna output trimado se válido

**`DomainException.ts` e filhos**

- Exceções específicas do domínio
- `ModelNotFoundException`: modelo não existe no registry
- `InvalidAdFormatException`: output não é Markdown válido

#### Application Layer (Orquestração)

**`AgentStateDefinition.ts`**

- Define `Annotation.Root()` para estado do LangGraph
- Tipos: `AgentState`, `AgentStateType`
- Sem lógica, apenas infraestrutura

**`AdGeneratorGraphBuilder.ts`**

- Constrói o grafo LangGraph
- Método `build(services): StateGraph`
- Nós: `loadInstructions`, `generateAd`, `validateOutput`
- Edges lineares sem conditional logic

**`MessageParser.ts`**

- Extrai texto de diferentes formatos de mensagem
- Método `parse(content): string` (antes era `contentToText`)
- Centraliza lógica de parse

**`AdStreamGenerator.ts`**

- Generator assíncrono para streaming
- Método: `stream({ input, model }): AsyncGenerator<string, { ad }, void>`
- Filtra eventos "generateAd" do grafo
- Integra `MessageParser` para extract text
- Retorna anúncio final validado

#### Interface Pública

**`adGeneratorAgent.ts`**

- Exporta `adGeneratorAgent` compilado (instância do grafo)
- Exporta `streamGeneratedAd()` função wrapper
- Exporta tipos públicos: `SupportedModel`, `SUPPORTED_MODELS`
- Atua como **facade** simplificando acesso

### Clean Code Aplicado

1. **Nomes Descritivos**
   - `ModelRegistry` em vez de `MODEL_CONFIGS`
   - `InstructionService` comunica claramente função
   - `ModelInitializerService` vs `initializeModel` inline
   - `AdGenerationService` vs função solta `generateAd`

2. **Comentários Removidos**
   - Comentários explicadores removidos (código fala por si)
   - Comentários de tipo removidos (TypeScript infere)
   - Mantém apenas comentários de **why**, não **what**

3. **Funções Pequenas**
   - Cada função tem 1 responsabilidade
   - Nomes verbais claros: `load()`, `validate()`, `initialize()`, `generate()`

4. **Sem Lógica Condicional Complexa**
   - Factory methods e value objects para validação
   - Registry pattern em vez de if/else
   - Exceções para casos de erro

5. **Testes Facilitados**
   - Classes isoladas = testes isolados
   - Interfaces claras = mocks simples
   - Camadas independentes = teste unitário vs integração

## Critérios de Aceitação

- [ ] **CA1**: Estrutura DDD criada conforme diagrama
- [ ] **CA2**: `ModelRegistry` substitui `MODEL_CONFIGS`, método `get()` implementado
- [ ] **CA3**: Serviços de domínio criados (`InstructionService`, `ModelInitializerService`, `AdGenerationService`, `OutputValidationService`)
- [ ] **CA4**: Exceções específicas de domínio lançadas (`ModelNotFoundException`, `InvalidAdFormatException`)
- [ ] **CA5**: `AdGeneratorGraphBuilder` constrói grafo sem nodes implementarem lógica
- [ ] **CA6**: `MessageParser` centraliza parse de mensagens
- [ ] **CA7**: `AdStreamGenerator` implementado com stream assíncrono
- [ ] **CA8**: `adGeneratorAgent.ts` atua como facade exportando interface pública
- [ ] **CA9**: Todos os comentários desnecessários removidos, nomenclatura comunica intenção
- [ ] **CA10**: Testes refatorados para estrutura modular (domain/, application/)
- [ ] **CA11**: TypeScript: 0 erros, sem `@ts-ignore`
- [ ] **CA12**: Testes passando: 100% de cobertura para serviços; API route funciona transparentemente

## Estimativa de Tempo

| Atividade                       | Tempo   |
| ------------------------------- | ------- |
| Criação estrutura pasta         | 1h      |
| Implementação domain layer      | 4h      |
| Implementação application layer | 3h      |
| Refatoração testes              | 2.5h    |
| Validação & cleanup             | 1.5h    |
| **Total**                       | **12h** |

## Notas Adicionales

1. **Backward Compatibility**: Interface pública (`adGeneratorAgent`, `streamGeneratedAd`) permanece idêntica
   - Consumidores (API routes) não precisam de mudanças
   - Refatoração é interna (100% safe)

2. **Extensibilidade**: Adicionar novo modelo requer apenas:
   - Adicionar entrada em `ModelRegistry`
   - Nenhuma mudança em `adGeneratorAgent.ts`

3. **Testing**: Estrutura modular permite:
   - Testes unitários de serviços (sem LangGraph)
   - Testes de integração de grafo
   - Testes E2E de stream

4. **Princípios SOLID**: Cada classe exemplifica um ou mais princípios, facilitando:
   - Documentação de aprendizado
   - Code reviews
   - Manutenção futura
