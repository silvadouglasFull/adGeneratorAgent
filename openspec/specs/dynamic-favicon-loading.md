# Proposta (proposal.md)

## O quê e porquê:

Para melhorar a manutenção e a consistência da marca, precisamos de um sistema para gerenciar e exibir dinamicamente os favicons da aplicação. Atualmente, a gestão de favicons é manual e propensa a erros. Esta mudança irá centralizar a definição dos favicons num único arquivo de "sabor" (flavor) e carregar dinamicamente esses ícones no layout principal da aplicação, garantindo que todas as páginas tenham o favicon correto e facilitando futuras atualizações.

## Centralização de Assets:

Um arquivo src/flavor/ds-web-flavor.ts será utilizado para definir todos os caminhos para os assets de favicon.
Este arquivo exportará um objeto assets contendo um array favicon_io. Cada item no array representará um favicon e conterá seu name e path.
Carregamento Dinâmico no Layout:

O componente src/app/layout.tsx será modificado para importar o objeto assets.
Dentro do componente RootLayout, na tag <head>, iremos iterar sobre o array assets.favicon_io.
Para cada item, uma tag <link> será renderizada dinamicamente com os atributos apropriados (rel, href, sizes, type) com base no nome do arquivo do ícone.
A exportação estática metadata será removida em favor desta abordagem dinâmica para evitar conflitos.
