# Especificação OpenSpec: Clone WhatsApp Web

id: whatsapp-web-clone-ui
version: 1.0.0
title: Interface Clone do WhatsApp Web
status: draft
created: 2026-03-16

## Visão Geral

Desenvolver uma interface web responsiva inspirada no WhatsApp Web, utilizando React e Tailwind CSS. O objetivo é criar um clone visual e funcional da interface, focando em experiência de usuário, responsividade e fidelidade visual.

## Requisitos Funcionais

### 1. Layout Geral

- Duas colunas principais:
  - **Sidebar Esquerda:** Lista de contatos, barra de pesquisa, ícones no topo.
  - **Área Principal Direita:** Conversa ativa, cabeçalho, área de mensagens, rodapé de envio.

### 2. Sidebar (Coluna Esquerda)

- Topo com ícones: status, novo chat, menu (três pontos).
- Barra de pesquisa para contatos.
- Lista de contatos:
  - Foto do contato (avatar)
  - Nome do contato
  - Prévia da última mensagem
  - Horário da última mensagem

### 3. Área de Conversa (Coluna Direita)

- Cabeçalho com:
  - Foto do contato
  - Nome do contato
  - Status (online/última vez)
  - Ícones de chamada e menu
- Área de mensagens:
  - Bolhas de chat (verde para mensagens enviadas, branco para recebidas)
  - Exibir horário em cada mensagem
- Rodapé:
  - Campo de entrada de texto
  - Ícone de envio (paper plane)

### 4. Estilo Visual

- Utilizar Tailwind CSS para toda a estilização.
- Paleta de cores oficial do WhatsApp:
  - Verde: #25D366
  - Verde escuro: #075E54
  - Cinza claro: #ECE5DD
  - Fundo escuro: #222D31
  - Fundo claro: #FFFFFF
- Suporte a modo escuro e claro.

### 5. Responsividade

- Layout adaptável para desktop e mobile.
- Sidebar pode ser recolhida em telas pequenas.

### 6. Funcionalidade

- Interatividade com React:
  - Seleção de contato na sidebar exibe a conversa correspondente na área principal.
  - Simulação de envio de mensagem (mensagem aparece na área de chat ao enviar).

## Critérios de Aceitação

- [ ] Layout com duas colunas principais, responsivo.
- [ ] Sidebar com ícones, barra de pesquisa e lista de contatos conforme requisitos.
- [ ] Área de conversa com cabeçalho, mensagens e rodapé conforme requisitos.
- [ ] Estilização fiel à paleta de cores do WhatsApp usando Tailwind CSS.
- [ ] Funcionalidade de seleção de contato e envio de mensagem simulada.
- [ ] Suporte a modo escuro e claro.

## Restrições

- Não utilizar bibliotecas de UI prontas (ex: Material UI, Ant Design).
- Todo o CSS deve ser feito com Tailwind.
- Não é necessário backend ou persistência de dados.

## Observações

- O foco é na fidelidade visual e experiência de usuário.
- Mensagens e contatos podem ser mockados em arrays estáticos.
