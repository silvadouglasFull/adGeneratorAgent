# Spec: Padrão de Geração de Código por IA (DDD + Clean Code + SOLID)

## Visão Geral

Definir um padrão obrigatório para qualquer código-fonte gerado por IA neste projeto. A IA deve priorizar design orientado a domínio (DDD), princípios SOLID, Clean Code e uso de classes sempre que houver ganho real de coesão, testabilidade e manutenção.

## Objetivo

Garantir consistência arquitetural e qualidade de código em toda nova implementação, evitando código monolítico, acoplado e difícil de testar.

## Escopo

Aplica-se a:

- Novas features
- Refatorações
- Correções de bugs que criem/alterem estruturas de domínio
- Código de aplicação, domínio e infraestrutura
- Testes automatizados

Não se aplica a:

- Provas de conceito descartáveis
- Scripts temporários de debug local (desde que não sejam versionados)

## Diretrizes Obrigatórias

### 1) DDD (Domain-Driven Design)

- Separar responsabilidades por camadas quando aplicável:
  - `domain`: regras de negócio, value objects, entidades, exceções de domínio, serviços de domínio
  - `application`: orquestração de casos de uso, coordenação entre serviços
  - `infrastructure`: detalhes técnicos e integrações externas
- A linguagem do código deve refletir o domínio (ubiquitous language).
- Regras de negócio não devem depender de framework.
- Erros de domínio devem usar exceções específicas do domínio.

### 2) SOLID

- **S (Single Responsibility)**: cada classe/função deve ter um motivo único de mudança.
- **O (Open/Closed)**: preferir extensão por composição/estratégia em vez de modificar fluxo central.
- **L (Liskov Substitution)**: contratos devem ser substituíveis sem comportamento inesperado.
- **I (Interface Segregation)**: interfaces pequenas e focadas.
- **D (Dependency Inversion)**: depender de abstrações, não de concretos.

### 3) Clean Code

- Nomes descritivos e orientados à intenção.
- Funções pequenas e coesas.
- Evitar comentários redundantes; o código deve se explicar por nomenclatura.
- Proibir `any` sem justificativa técnica explícita e pontual.
- Evitar duplicação (DRY) sem overengineering.
- Tratamento de erro claro e contextual.

### 4) Uso de classes (quando viável)

A IA deve preferir classes quando houver pelo menos um dos cenários:

- Encapsular regra de negócio com estado interno/coeso
- Coordenar múltiplas dependências
- Necessidade de injeção de dependências
- Claramente representar serviço, estratégia, factory, registry ou caso de uso

A IA pode usar funções puras quando:

- Transformação simples e isolada
- Sem estado interno
- Sem dependências complexas

## Estrutura Recomendada

```text
src/
  <contexto>/
    domain/
      model/
      service/
      exception/
    application/
      use-case/
      service/
    infrastructure/
      adapters/
      persistence/
```

## Critérios de Aceitação

- [x] Todo código novo respeita separação por camadas (quando aplicável)
- [x] Regras de negócio estão no domínio, não no controller/route
- [x] Classes criadas para serviços e orquestração relevantes
- [x] Dependências são injetadas por construtor quando aplicável
- [x] Não há comentários desnecessários explicando "o que" o código faz
- [x] Não há `any` não justificado
- [x] Testes cobrem comportamento de domínio e aplicação
- [x] `pnpm test` passa
- [x] `npx tsc --noEmit` passa sem erros

## Definição de Pronto (DoD)

Uma entrega só é considerada pronta quando:

1. Compila sem erros de TypeScript
2. Testes passam
3. Estrutura respeita DDD/SOLID/Clean Code
4. Não há regressão de comportamento
5. Código é legível e com responsabilidades explícitas

## Prompt Operacional para IA

Usar as instruções abaixo como contrato de geração:

> Gere código seguindo DDD, SOLID e Clean Code.
> Separe responsabilidades por camadas (domain, application, infrastructure) quando aplicável.
> Use classes para serviços/orquestração/encapsulamento de regras, e funções puras apenas para transformações simples.
> Evite comentários desnecessários, nomes genéricos e acoplamento indevido.
> Priorize testabilidade (injeção de dependência, coesão, baixo acoplamento).
> Preserve compatibilidade da interface pública existente, salvo requisito explícito em contrário.

## Restrições

- Não inventar requisitos além da spec ativa da feature.
- Não alterar contrato público sem atualizar spec e tasks.
- Não introduzir complexidade sem ganho claro.

## Métricas de Qualidade Esperadas

- Alta coesão por classe
- Baixo acoplamento entre camadas
- Cobertura de testes focada em comportamento
- Complexidade ciclomática controlada nas unidades de domínio
