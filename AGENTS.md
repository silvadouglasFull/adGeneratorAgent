# AGENTS.md

## Regras gerais

- Sempre ler arquivos em /specs antes de implementar
- Sempre aplicar a spec: `openspec/specs/ai-code-generation-standards.md`
- Nunca implementar sem critérios de aceitação
- Código deve ser simples e legível
- Evitar overengineering

## Fluxo obrigatório

1. Ler as especs do diretório /specs
2. Aplicar obrigatoriamente os padrões de DDD, SOLID e Clean Code definidos em `openspec/specs/ai-code-generation-standards.md`
3. Gerar tasks.md se não existir
4. Implementar baseado nas tasks
5. Criar testes automatizados
6. Garantir que todos os critérios de aceitação passam

## Testes

- Priorizar cobertura dos critérios de aceitação
- Testes devem ser claros e diretos

## Restrições

- Não inventar requisitos não descritos
- Não alterar comportamento sem atualizar spec
- Não gerar código novo sem considerar uso de classes quando viável (conforme spec de padrões)
- Não criar arquivos explicando o que foi implementado
- Não crie resumos muitos longos após executar cada solicitação.
