# Tarefas (tasks.md)

## Passos de Implementação:

[X] Criar um array favicon_on no arquivo src/flavor/ds-web-flavor.ts para armazenar os nomes e caminhos dos arquivos de favicon.
[X] Listar os arquivos no diretório public/ds-web-flavor/favicon_io para identificar todos os favicons disponíveis.
[X] Preencher o array favicon_on com um objeto para cada arquivo, contendo o name e o path relativo à pasta public.
[X] Modificar o nome do array para favicon_io e refatorar a estrutura do arquivo ds-web-flavor.ts para incluir um basePathAssets para melhor manutenibilidade.
[X] No arquivo src/app/layout.tsx, importar o objeto assets de ds-web-flavor.ts.
[X] Remover a exportação de metadados estática (export const metadata: Metadata = ...).
[X] Dentro do <head> do RootLayout, adicionar um bloco de código para mapear o array assets.favicon_io e renderizar as tags <link> correspondentes para cada ícone.
[X] Implementar a lógica para definir os atributos rel, type e sizes corretamente com base no nome de cada arquivo de ícone (ex: apple-touch-icon, manifest, .ico, .png).
