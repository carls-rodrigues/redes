# Guia Completo: Sistema de Sockets do Backend de Chat

## 📋 Visão Geral

Este documento fornece um guia focado no sistema de sockets implementado no backend do chat. Vamos explorar desde o handshake WebSocket até o processamento de mensagens em tempo real, incluindo arquitetura de conexões, protocolos e comunicação bidirecional.

## 🏗️ Arquitetura do Sistema

### 1. Servidor Híbrido (TCP + WebSocket)

O servidor foi projetado para suportar tanto conexões WebSocket quanto TCP raw, permitindo flexibilidade para diferentes tipos de clientes.

```typescript
// server.ts - Servidor principal
const server = net.createServer((socket) => {
  // Detecção automática do protocolo
  const detectProtocol = (data: Buffer) => {
    // Verifica se é HTTP/WebSocket ou TCP raw
    if (dataStr.startsWith('GET ')) {
      handleWebSocketUpgrade(socket, buffer, clientId);
    } else {
      handleRawTcpConnection(socket, buffer, clientId);
    }
  };
});
```

### 2. Gerenciamento de Conexões

O `SocketHandler` gerencia todas as conexões ativas:

```typescript
interface ClientInfo {
  userId?: string;
  socket: Socket;
  session?: Session;
  isWebSocket?: boolean;
  sendMessage?: (message: any) => void;
}

export class SocketHandler {
  private clients: Map<string, ClientInfo> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> clientId
}
```

## 🔐 Handshake WebSocket

### Processo de Upgrade HTTP

1. **Cliente envia requisição HTTP**:

   ```http
   GET /ws HTTP/1.1
   Host: localhost:5000
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
   Sec-WebSocket-Version: 13
   ```

2. **Servidor valida e responde**:

   ```typescript
   // Validação dos headers
   if (headers['upgrade']?.toLowerCase() !== 'websocket') {
     socket.destroy();
     return;
   }

   const key = headers['sec-websocket-key'];
   if (!key) {
     socket.destroy();
     return;
   }

   // Geração do token de aceitação (RFC 6455)
   const acceptToken = crypto
     .createHash('sha1')
     .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
     .digest('base64');

   // Resposta de upgrade
   const response = [
     'HTTP/1.1 101 Switching Protocols',
     'Upgrade: websocket',
     'Connection: Upgrade',
     `Sec-WebSocket-Accept: ${acceptToken}`,
     '', ''
   ].join('\r\n');
   ```

3. **Conexão estabelecida**: A partir deste momento, a comunicação passa a usar o protocolo WebSocket.

## 📦 Protocolo WebSocket

### Estrutura dos Frames

Cada mensagem WebSocket é enviada em frames com a seguinte estrutura:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|0|0|0|0|Opcode|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|1|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Campos importantes**:

- **FIN**: Indica se é o último frame da mensagem
- **Opcode**: Tipo da frame (1 = texto, 8 = close, 9 = ping, 10 = pong)
- **Mask**: Indica se o payload está mascarado (sempre true para clientes)
- **Payload Length**: Tamanho dos dados

### Processamento de Frames

```typescript
socket.on('data', async (chunk: Buffer) => {
  frameBuffer = Buffer.concat([frameBuffer, chunk]);

  while (frameBuffer.length >= 2) {
    const byte1 = frameBuffer[0];
    const byte2 = frameBuffer[1];

    const fin = (byte1 & 0x80) >> 7;
    const opcode = byte1 & 0x0f;
    const masked = (byte2 & 0x80) >> 7;
    let payloadLen = byte2 & 0x7f;

    // Validações de segurança
    if (!fin || rsv !== 0) {
      socket.end();
      break;
    }

    if (!masked) {
      socket.end();
      break;
    }

    // Processamento baseado no opcode
    if (opcode === 0x1) { // Text frame
      const message = JSON.parse(payload.toString('utf-8'));
      await handler.handleMessage(clientId, message);
    } else if (opcode === 0x8) { // Close frame
      handler.unregisterClient(clientId);
      socket.end();
    } else if (opcode === 0x9) { // Ping frame
      const pongFrame = Buffer.from([0x8a, 0x00]);
      socket.write(pongFrame);
    }
  }
});
```

## 💬 Sistema de Mensagens

### Estrutura das Mensagens

Todas as mensagens seguem um formato JSON padronizado:

```typescript
interface SocketMessage {
  type: string;           // Tipo da operação
  request_id?: string;    // ID para rastreamento de resposta
  [key: string]: any;     // Dados específicos da operação
}
```

### Tipos de Mensagens Suportadas

#### 1. Autenticação

```typescript
// Login
{
  "type": "login",
  "username": "usuario",
  "password": "senha"
}

// Autenticação com token
{
  "type": "auth",
  "token": "session_token"
}
```

#### 2. Gerenciamento de Chats

```typescript
// Obter chats do usuário
{
  "type": "get_user_chats"
}

// Obter mensagens de um chat
{
  "type": "get_messages",
  "chat_id": "chat_session_id"
}

// Enviar mensagem
{
  "type": "message",
  "chat_id": "chat_session_id",
  "content": "Olá, mundo!"
}
```

#### 3. Gerenciamento de Grupos

```typescript
// Criar grupo
{
  "type": "create_group",
  "group_name": "Nome do Grupo",
  "member_ids": ["user1", "user2"]
}

// Adicionar membro
{
  "type": "add_group_member",
  "group_id": "group_id",
  "user_id": "user_id"
}
```

### Processamento de Mensagens

O `SocketHandler` roteia cada mensagem baseada no tipo:

```typescript
async handleMessage(clientId: string, message: SocketMessage) {
  try {
    switch (message.type) {
      case 'auth':
        await this.handleAuth(clientId, message);
        break;
      case 'login':
        await this.handleLogin(clientId, message);
        break;
      case 'get_messages':
        await this.handleGetMessages(clientId, message);
        break;
      case 'message':
        await this.handleSendMessage(clientId, message);
        break;
      // ... outros casos
    }
  } catch (error) {
    this.sendError(clientId, 'Internal server error', message.request_id);
  }
}
```

## 🔄 Comunicação em Tempo Real

### Broadcasting de Mensagens

Quando uma mensagem é enviada, ela é automaticamente distribuída para todos os participantes:

```typescript
private async handleSendMessage(clientId: string, message: SocketMessage) {
  // Salva a mensagem no banco
  const savedMessage = await messageService.sendMessage(
    chat_id, client.session.user_id, content
  );

  // Notifica todos os participantes online
  const participants = await chatService.getChatParticipants(chat_id);

  for (const participant of participants) {
    const participantClientId = this.userSessions.get(participant.user_id);
    if (participantClientId && participantClientId !== clientId) {
      this.sendMessage(participantClientId, {
        type: 'message:new',
        payload: {
          ...savedMessage,
          chat_session_id: chat_id,
          timestamp: savedMessage.timestamp
        }
      });
    }
  }
}
```

### Sistema de Read Receipts

As mensagens incluem informações de leitura:

```typescript
interface Message {
  id: string;
  chat_session_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  read_at?: string;      // Quando foi lida
  read_by?: string;      // Quem leu (JSON array)
}
```

Quando um usuário solicita mensagens, elas são automaticamente marcadas como lidas:

```typescript
async getMessages(chatId: string, userId?: string): Promise<Message[]> {
  // Marca mensagens não lidas como lidas
  if (userId) {
    const markAsReadStmt = db.prepare(`
      UPDATE messages
      SET read_at = ?, read_by = ?
      WHERE chat_session_id = ?
      AND sender_id != ?
      AND (read_at IS NULL OR read_by IS NULL)
    `);
    markAsReadStmt.run(new Date().toISOString(), JSON.stringify([userId]), chatId, userId);
  }
  // ... resto da query
}
```

## � Gerenciamento de Conexões

### Ciclo de Vida das Conexões

1. **Conexão estabelecida**: Cliente se conecta via TCP ou WebSocket
2. **Registro**: Cliente é registrado no `SocketHandler`
3. **Autenticação**: Cliente envia credenciais ou token
4. **Sessão ativa**: Cliente pode enviar/receber mensagens
5. **Desconexão**: Cliente é removido do sistema

### Limpeza de Recursos

```typescript
unregisterClient(clientId: string) {
  const client = this.clients.get(clientId);
  if (client?.userId) {
    this.userSessions.delete(client.userId);
  }
  this.clients.delete(clientId);
}
```

### Heartbeat (Ping/Pong)

O servidor responde automaticamente a pings WebSocket:

```typescript
} else if (opcode === 0x9) { // Ping frame
  const pongFrame = Buffer.from([0x8a, 0x00]);
  if (socket.writable && !socket.destroyed) {
    socket.write(pongFrame);
  }
}
```

## 🚨 Tratamento de Erros

### Tipos de Erro

1. **Erros de Protocolo**: Frames WebSocket inválidos
2. **Erros de Autenticação**: Tokens inválidos ou expirados
3. **Erros de Validação**: Dados malformados
4. **Erros de Conectividade**: Conexões perdidas

### Respostas de Erro

```typescript
private sendError(clientId: string, message: string, requestId?: string) {
  const error: any = {
    status: 'error',
    message: message
  };
  if (requestId) {
    error.request_id = requestId;
  }
  this.sendMessage(clientId, error);
}
```

## 📊 Monitoramento e Logs

### Logs Estruturados

O sistema registra eventos importantes:

```typescript
console.log(`[${new Date().toISOString()}] WebSocket client connected: ${clientId}`);
console.log(`[${new Date().toISOString()}] Raw TCP client connected: ${clientId}`);
console.error(`Error parsing message from ${clientId}:`, err);
```

### Métricas de Conexão

- Número de clientes conectados
- Tipos de protocolo (WebSocket vs TCP)
- Taxa de mensagens por segundo
- Latência de resposta

## 🔒 Segurança

### Validações Implementadas

1. **WebSocket Frames**: Validação de headers e estrutura
2. **Autenticação**: Verificação de tokens de sessão
3. **Autorização**: Controle de acesso baseado em participação
4. **Sanitização**: Validação de dados de entrada

### Proteções contra Ataques

- **Flooding**: Limitação de mensagens por usuário
- **Session Hijacking**: Tokens únicos por sessão
- **Protocol Attacks**: Validação rigorosa de frames WebSocket

## 🚀 Otimizações de Socket

### Conexões Persistentes

- **WebSocket**: Mantém conexão TCP aberta para comunicação bidirecional
- **Buffering**: Processamento eficiente de frames fragmentados
- **Memory Management**: Limpeza automática de conexões desconectadas

### Limitações do Socket Atual

- **Single Thread**: Node.js processa todas as conexões em uma thread
- **Memory Bound**: Estado de todas as conexões mantido em memória
- **Conexões Simultâneas**: Limitado pelos recursos do sistema

## 📚 Conclusão

Este sistema de sockets implementa comunicação em tempo real robusta com suporte a múltiplos protocolos. A arquitetura híbrida permite flexibilidade para diferentes tipos de clientes, enquanto o sistema de broadcasting garante entrega instantânea de mensagens.

### Pontos Fortes dos Sockets

- ✅ **Protocolo Agnóstico**: Suporte simultâneo a WebSocket e TCP
- ✅ **Tempo Real**: Broadcasting instantâneo via conexões persistentes
- ✅ **Full-Duplex**: Comunicação bidirecional simultânea
- ✅ **Confiável**: Confirmação de entrega e tratamento de desconexões
- ✅ **Seguro**: Validação rigorosa de protocolos e frames

### Áreas de Melhoria Futura

- 🔄 **WebSocket Compression**: Compressão de mensagens (permessage-deflate)
- 🔄 **Connection Pooling**: Gerenciamento avançado de conexões
- 🔄 **Load Balancing**: Distribuição de carga entre múltiplas instâncias
- 🔄 **Binary Messages**: Suporte a dados binários além de texto

---

**Autor**: Sistema de Chat Redes  
**Versão**: 1.0.0  
**Data**: Novembro 2025
