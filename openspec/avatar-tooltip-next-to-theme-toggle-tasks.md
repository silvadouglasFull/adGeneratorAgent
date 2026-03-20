# Tasks: Avatar com Tooltip de Nome do Usuário ao lado do ThemeToggle

Spec de referência: `openspec/specs/avatar-tooltip-next-to-theme-toggle.md`
Spec base obrigatória: `openspec/specs/ai-code-generation-standards.md`

---

## Fase 1 — Componente de Avatar

### T1 — Criar componente de avatar genérico

- [ ] Criar componente reutilizável (ex.: `UserAvatarWithTooltip`)
- [ ] Renderizar avatar circular com ícone SVG genérico de usuário
- [ ] Adicionar `aria-label` adequado no trigger do avatar
- **Critério**: avatar visual é renderizado corretamente sem depender de imagem de perfil

### T2 — Implementar tooltip no hover

- [ ] Adicionar estrutura de tooltip com `role="tooltip"`
- [ ] Exibir tooltip ao hover sobre o avatar
- [ ] Ocultar tooltip ao remover hover
- [ ] Aplicar classes Tailwind/Flowbite compatíveis com transição de opacity/visibility
- **Critério**: tooltip de nome aparece e desaparece corretamente no hover

---

## Fase 2 — Integração com Sessão e Layout

### T3 — Integrar nome da sessão no tooltip

- [ ] Ler nome do usuário autenticado da sessão atual
- [ ] Exibir `session.user.name` no tooltip
- [ ] Aplicar fallback `Usuário` quando nome estiver ausente
- **Critério**: tooltip sempre mostra um nome válido sem quebrar a UI

### T4 — Posicionar avatar ao lado do ThemeToggle

- [ ] Integrar componente no bloco superior onde o `ThemeToggle` é renderizado
- [ ] Garantir alinhamento horizontal e espaçamento consistente
- [ ] Manter layout funcional em telas pequenas
- **Critério**: avatar aparece imediatamente ao lado do botão de tema

---

## Fase 3 — Testes e Validação

### T5 — Cobertura de testes da feature

- [ ] Testar renderização do avatar
- [ ] Testar renderização do tooltip com nome da sessão
- [ ] Testar fallback `Usuário` quando nome não existe
- [ ] Testar presença do avatar no layout ao lado do `ThemeToggle`
- **Critério**: fluxo principal e fallback cobertos por testes claros

### T6 — Validação final

- [ ] Executar `pnpm test`
- [ ] Executar `npx tsc --noEmit`
- [ ] Validar manualmente hover do tooltip no avatar
- **Critério**: feature pronta sem regressão visual e sem erros de compilação

---

## Ordem de Execução Sugerida

```text
T1 → T2 → T3 → T4 → T5 → T6
```

## Estimativa de Complexidade

| Task | Complexidade |
| ---- | ------------ |
| T1   | Baixa        |
| T2   | Baixa        |
| T3   | Baixa        |
| T4   | Baixa        |
| T5   | Média        |
| T6   | Baixa        |
