# Fluxogramas do Sistema de Chat

Este documento contém fluxogramas detalhados das principais features do sistema de chat, mostrando o caminho completo desde a interação do usuário até o retorno da resposta via WebSocket.

## Features Disponíveis

### 🔐 Autenticação

- [**Login**](fluxograma-login.md) - Processo completo de autenticação de usuário
- [**Register**](fluxograma-register.md) - Processo de criação de nova conta
- [**Logout**](fluxograma-logout.md) - Processo de desconexão e limpeza de sessão

### 💬 Mensagens

- [**Get Messages**](fluxograma-get-messages.md) - Carregamento de mensagens de uma conversa
- [**Send Message**](fluxograma-send-message.md) - Envio de mensagens com broadcast em tempo real
- [**Read Receipts**](fluxograma-read-receipts.md) - Confirmações de leitura das mensagens

### 👥 Conversas

- [**Create DM**](fluxograma-create-dm.md) - Criação de conversa direta entre usuários
- [**Create Group**](fluxograma-create-group.md) - Criação de grupo com múltiplos membros
- [**Get User Chats**](fluxograma-get-user-chats.md) - Listagem de todas as conversas do usuário

### 🔍 Busca

- [**Search Users**](fluxograma-search-users.md) - Busca de usuários por nome de usuário

## Estrutura dos Fluxogramas

Cada fluxograma contém:

### 📱 **Frontend (React/Next.js)**

- Componentes React envolvidos
- Validações no cliente
- Gerenciamento de estado da UI
- Tratamento de respostas WebSocket

### 🖥️ **Backend (Node.js)**

- Handlers WebSocket no servidor
- Validações no servidor
- Consultas ao banco de dados
- Lógica de negócio

### 🔄 **Fluxo Completo**

- Conexão WebSocket estabelecida
- Timeout handling (30 segundos)
- Tratamento de erros em todas as etapas
- Estados da UI (loading, sucesso, erro)

### 📁 **Arquivos Envolvidos**

- `websocket-context.tsx` - Gerenciamento de conexões WebSocket
- `SocketHandler.ts` - Processamento de mensagens no backend
- Componentes específicos de cada feature
- Serviços de banco de dados

## Convenções dos Fluxogramas

- 🔄 **Processos assíncronos** - Operações que envolvem rede/banco
- ✅ **Estados de sucesso** - Caminhos bem-sucedidos
- ❌ **Estados de erro** - Tratamento de falhas
- ⏱️ **Timeouts** - Limites de tempo para operações
- 📡 **WebSocket** - Comunicação em tempo real
- 💾 **Database** - Operações de persistência

## Como Usar

1. Escolha a feature desejada na lista acima
2. Abra o arquivo Markdown correspondente
3. Visualize o fluxograma Mermaid
4. Siga o caminho desde a interação do usuário até a resposta final
