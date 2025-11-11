# 📚 Documentação do Projeto Redes - Sistema de Chat

Esta pasta contém toda a documentação técnica e de usuário do sistema de chat desenvolvido para a disciplina de Redes.

## 📁 Estrutura da Documentação

### 🎯 **Guias de Uso**

- [**COMO_EXECUTAR.md**](docs/COMO_EXECUTAR.md) - Guia completo para executar o projeto
- [**GUIA_SOCKET_BACKEND.md**](docs/GUIA_SOCKET_BACKEND.md) - Documentação técnica do backend WebSocket

### 🔄 **Fluxogramas - Comunicação WebSocket**

Documentação detalhada de todas as mensagens WebSocket do sistema:

#### 🔐 **Autenticação**

- [**Login**](docs/fluxograma-login.md) - Processo de autenticação de usuário
- [**Register**](docs/fluxograma-register.md) - Criação de nova conta
- [**Logout**](docs/fluxograma-logout.md) - Desconexão e limpeza de sessão

#### 💬 **Mensagens**

- [**Get Messages**](docs/fluxograma-get-messages.md) - Carregamento de mensagens de uma conversa
- [**Send Message**](docs/fluxograma-send-message.md) - Envio com broadcast em tempo real

#### 👥 **Conversas**

- [**Create DM**](docs/fluxograma-create-dm.md) - Conversa direta entre usuários
- [**Create Group**](docs/fluxograma-create-group.md) - Grupo com múltiplos membros
- [**Get User Chats**](docs/fluxograma-get-user-chats.md) - Lista todas as conversas do usuário

#### 🔍 **Busca**

- [**Search Users**](docs/fluxograma-search-users.md) - Busca de usuários por nome

### 📋 **Índice Completo**

- [**FLUXOGRAMAS.md**](docs/FLUXOGRAMAS.md) - Índice organizado de todos os fluxogramas

## 🏗️ **Arquitetura do Sistema**

### **Frontend** (React/Next.js + TypeScript)

- Interface moderna e responsiva
- WebSocket para comunicação em tempo real
- Gerenciamento de estado com hooks customizados
- Componentes reutilizáveis com shadcn/ui

### **Backend** (Node.js + TypeScript)

- Servidor WebSocket para mensagens em tempo real
- SQLite como banco de dados
- Autenticação e autorização de usuários
- Gerenciamento de conversas e mensagens

### **Comunicação**

- Protocolo WebSocket bidirecional
- Timeout de 30 segundos para todas as operações
- Confirmação de entrega de mensagens
- Broadcast para múltiplos participantes

## 🚀 **Como Usar**

1. **Para executar o projeto**: Consulte [docs/COMO_EXECUTAR.md](docs/COMO_EXECUTAR.md)
2. **Para entender o backend**: Leia [docs/GUIA_SOCKET_BACKEND.md](docs/GUIA_SOCKET_BACKEND.md)
3. **Para ver fluxos específicos**: Navegue pelos fluxogramas correspondentes

## 📊 **Estrutura JSON das Mensagens**

Cada fluxograma contém:

- ✅ Estrutura da mensagem enviada (Frontend → Backend)
- ✅ Estrutura da resposta (Backend → Frontend)
- ✅ Tratamento de erros e timeouts
- ✅ Exemplos práticos de uso

## 🎯 **Convenções dos Fluxogramas**

- 📤 **Mensagem enviada** do frontend
- 📥 **Resposta recebida** do backend
- 📡 **Broadcast** para múltiplos destinatários
- 🔄 **Processos assíncronos**
- ✅ **Estados de sucesso**
- ❌ **Estados de erro**
- ⏱️ **Timeouts de 30 segundos**

---

**📝 Nota**: Esta documentação é mantida atualizada com o código do sistema. Para dúvidas ou sugestões, consulte os arquivos específicos ou abra uma issue no repositório.
