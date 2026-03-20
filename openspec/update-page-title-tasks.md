### Proposta (`proposal.md`)

**O quê e porquê:**

O título atual da aplicação é o genérico "Create Next App". É necessário atualizá-lo para "Zapt AI AD GENERATOR" para refletir a identidade do produto, fortalecer a marca e melhorar a clareza para o usuário sobre a finalidade da página.

### Design (`design.md`)

**Como:**

A alteração será realizada diretamente no arquivo de layout raiz da aplicação, `src/app/layout.tsx`.

1.  **Localização:** O arquivo a ser modificado é o `src/app/layout.tsx`, que define a estrutura HTML base para todas as páginas.
2.  **Modificação:** Dentro do componente `RootLayout`, a tag `<title>` existente no `<head>` será localizada, e seu conteúdo será substituído pelo novo título "Zapt AI AD GENERATOR".
3.  **Descrição (Opcional, mas recomendado):** A tag `<meta name="description">` também será atualizada para fornecer uma descrição mais relevante sobre a aplicação.

### Tarefas (`tasks.md`)

**Passos de Implementação:**

1.  [ ] Navegar até o arquivo `src/app/layout.tsx`.
2.  [ ] Localizar a tag `<title>` dentro da seção `<head>`.
3.  [ ] Alterar o conteúdo da tag `<title>` de "Create Next App" para "Zapt AI AD GENERATOR".
4.  [ ] (Opcional) Localizar a tag `<meta name="description">`.
5.  [ ] (Opcional) Alterar o atributo `content` da meta tag para uma descrição apropriada, como "Ad generation with Zapt AI".
6.  [ ] Salvar o arquivo e verificar se o título da página foi atualizado no navegador.
