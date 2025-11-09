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

### Tabela de Opcodes WebSocket

O protocolo WebSocket define diferentes tipos de frames através do campo **opcode** (4 bits):

| Opcode | Hex | Binário | Descrição | Uso no Sistema |
|--------|-----|---------|-----------|----------------|
| `0x0` | `0x00` | `0000` | Continuation Frame | Frames de continuação (não usado) |
| `0x1` | `0x01` | `0001` | Text Frame | **Mensagens JSON do chat** |
| `0x2` | `0x02` | `0010` | Binary Frame | Dados binários (não implementado) |
| `0x3-0x7` | `0x03-0x07` | `0011-0111` | Reservados | Não utilizados |
| `0x8` | `0x08` | `1000` | Close Frame | **Fechamento de conexão** |
| `0x9` | `0x09` | `1001` | Ping Frame | **Heartbeat do cliente** |
| `0xA` | `0x0A` | `1010` | Pong Frame | **Resposta ao ping** |
| `0xB-0xF` | `0x0B-0x0F` | `1011-1111` | Reservados | Não utilizados |

### Detalhamento dos Opcodes Usados

#### `0x1` - Text Frame (Frame de Texto)

- **Valor**: `1` (decimal), `0x01` (hexadecimal)
- **Uso**: Transporta mensagens de texto UTF-8
- **No sistema**: Todas as mensagens JSON do chat (auth, message, get_messages, etc.)
- **Exemplo**: `{"type": "message", "content": "Olá!", "chat_id": "123"}`

#### `0x8` - Close Frame (Frame de Fechamento)

- **Valor**: `8` (decimal), `0x08` (hexadecimal)
- **Uso**: Solicita ou confirma fechamento da conexão WebSocket
- **No sistema**: Usado quando cliente solicita desconexão
- **Ação**: Remove cliente do `SocketHandler` e fecha socket TCP

#### `0x9` - Ping Frame (Frame de Ping)

- **Valor**: `9` (decimal), `0x09` (hexadecimal)
- **Uso**: Verificação de conectividade (heartbeat)
- **No sistema**: Recebido do cliente para manter conexão ativa
- **Resposta**: Servidor envia automaticamente `0xA` (Pong)

#### `0xA` - Pong Frame (Frame de Pong)

- **Valor**: `10` (decimal), `0x0A` (hexadecimal)
- **Uso**: Resposta ao ping, confirma que conexão está ativa
- **No sistema**: Enviado automaticamente em resposta aos pings
- **Implementação**: `Buffer.from([0x8A, 0x00])` = frame pong vazia
  - `0x8A` = `10001010` em binário:
    - Bit 7 (FIN): 1 = último frame da mensagem
    - Bits 6-4 (RSV): 000 = campos reservados (devem ser 0)
    - Bits 3-0 (Opcode): 1010 = 10 = Pong frame
  - `0x00` = payload length 0 (frame vazia)

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

### Análise Detalhada: Processamento de Frames WebSocket

Vamos analisar linha por linha o código de processamento de frames WebSocket:

```typescript
socket.on('data', async (chunk: Buffer) => {
  frameBuffer = Buffer.concat([frameBuffer, chunk]);
```

**Linha 1-2**: Evento `data` do socket recebe dados binários (`Buffer`). Os dados são concatenados ao `frameBuffer` para acumular frames que podem chegar fragmentadas.

```typescript
  while (frameBuffer.length >= 2) {
```

**Linha 4**: Loop `while` que processa frames enquanto houver pelo menos 2 bytes (tamanho mínimo do header WebSocket).

```typescript
    const byte1 = frameBuffer[0];
    const byte2 = frameBuffer[1];
```

**Linhas 5-6**: Extrai os primeiros 2 bytes do frame buffer. Estes formam o header básico do frame WebSocket.

```typescript
    const fin = (byte1 & 0x80) >> 7;
    const opcode = byte1 & 0x0f;
```

**Linhas 8-9**:

- **FIN**: `(byte1 & 0x80) >> 7` - Extrai o bit 7 (mais significativo) de byte1
  - `0x80` = `10000000` (bit 7 setado)
  - `&` (AND) isola o bit 7
  - `>> 7` desloca o bit para a posição 0 (converte para 0 ou 1)
- **Opcode**: `byte1 & 0x0f` - Extrai os 4 bits menos significativos (0-3) de byte1
  - `0x0F` = `00001111` (bits 0-3 setados)

```typescript
    const masked = (byte2 & 0x80) >> 7;
    let payloadLen = byte2 & 0x7f;
```

**Linhas 11-12**:

- **MASK**: `(byte2 & 0x80) >> 7` - Extrai o bit 7 de byte2 (indica se payload está mascarado)
- **Payload Length**: `byte2 & 0x7F` - Extrai os 7 bits menos significativos (0-6) de byte2
  - `0x7F` = `01111111` (bits 0-6 setados)

```typescript
    // Validações de segurança
    if (!fin || rsv !== 0) {
      socket.end();
      break;
    }
```

**Linhas 15-19**: Validações de segurança obrigatórias do protocolo WebSocket:

- `!fin`: Apenas frames completos (FIN=1) são aceitos
- `rsv !== 0`: Bits reservados devem ser 0 (não implementados)

```typescript
    if (!masked) {
      socket.end();
      break;
    }
```

**Linhas 21-24**: Validação específica para clientes: payloads devem estar mascarados (RFC 6455).

```typescript
    // Processamento baseado no opcode
    if (opcode === 0x1) { // Text frame
      const message = JSON.parse(payload.toString('utf-8'));
      await handler.handleMessage(clientId, message);
```

**Linhas 27-30**: Processa frame de texto (opcode 0x1):

- Converte payload para string UTF-8
- Faz parse do JSON
- Passa para o `SocketHandler` processar a mensagem

```typescript
    } else if (opcode === 0x8) { // Close frame
      handler.unregisterClient(clientId);
      socket.end();
```

**Linhas 31-33**: Processa frame de fechamento (opcode 0x8):

- Remove cliente do sistema
- Fecha a conexão TCP

```typescript
    } else if (opcode === 0x9) { // Ping frame
      const pongFrame = Buffer.from([0x8a, 0x00]);
      socket.write(pongFrame);
```

**Linhas 34-36**: Processa frame de ping (opcode 0x9):

- Cria frame pong vazia: `[0x8A, 0x00]`
- `0x8A` = FIN=1, RSV=000, Opcode=0xA (Pong)
- `0x00` = payload length = 0
- Envia resposta automaticamente

```typescript
    }
  }
});
```

**Linhas 37-39**: Fecha o bloco do loop while e do event handler.

### Operações Bitwise Explicadas

#### Extração do Bit FIN

```text
byte1 = 10000001 (exemplo)
0x80 = 10000000
      & 10000000 (AND)
      = 10000000
     >> 7 (shift right)
      = 00000001 = 1 (FIN = true)
```

#### Extração do Opcode

```text
byte1 = 10000001 (exemplo)
0x0F = 00001111
      & 00000001 (AND)
      = 00000001 = 1 (Opcode = 0x1)
```

#### Extração do Mask Bit

```text
byte2 = 10000000 (exemplo)
0x80 = 10000000
      & 10000000 (AND)
      = 10000000
     >> 7 (shift right)
      = 00000001 = 1 (MASKED = true)
```

#### Extração do Payload Length

```text
byte2 = 10000000 (exemplo)
0x7F = 01111111
      & 00000000 (AND)
      = 00000000 = 0 (Length = 0)
```

### Por que essas validações são importantes

1. **FIN=1**: Garante que só processamos frames completos
2. **RSV=0**: Previne uso de extensões não implementadas
3. **MASKED**: Segurança obrigatória (RFC 6455) - clientes devem mascarar dados
4. **Opcode validation**: Só aceita opcodes conhecidos e implementados

Este código implementa um parser WebSocket robusto e seguro que segue estritamente o protocolo RFC 6455.## 💬 Sistema de Mensagens

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

## � Fluxo Completo de Mensagens

### Como uma Mensagem é Enviada e Recebida

Vamos acompanhar o caminho completo de uma mensagem desde o momento que o usuário digita até quando ela aparece na tela dos outros participantes.

#### 1. Cliente Envia a Mensagem (Frontend)

**Arquivo**: `chat_frontend/lib/use-websocket.ts`

```typescript
// Usuário clica em "Enviar" no chat
const sendChatMessage = (chatId: string, content: string) => {
  const requestId = sendMessage({
    type: 'message',
    chat_id: chatId,
    content: content
  });
  return requestId;
};
```

**O que acontece no frontend**:

1. **Hook `useWebSocket`** adiciona um `request_id` único à mensagem
2. **Converte para JSON** e envia via WebSocket: `ws.send(JSON.stringify(message))`
3. **Armazena na fila** de requisições pendentes para aguardar confirmação

#### 2. Mensagem Chega ao Servidor (Protocolo WebSocket)

**Arquivo**: `nodejs/src/server.ts`

```typescript
// Evento 'data' do socket recebe os bytes
socket.on('data', (data: Buffer) => {
  // 1. Dados são concatenados ao frameBuffer
  frameBuffer = Buffer.concat([frameBuffer, data]);
  
  // 2. Processa frames WebSocket completos
  while (frameBuffer.length >= 2) {
    const firstByte = frameBuffer[0];
    const secondByte = frameBuffer[1];
    
    // 3. Extrai informações do header
    const fin = (firstByte & 0x80) !== 0;           // Bit 7
    const opcode = firstByte & 0x0F;                // Bits 0-3
    const masked = (secondByte & 0x80) !== 0;       // Bit 7
    const payloadLength = secondByte & 0x7F;        // Bits 0-6
    
    // 4. Se é uma mensagem de texto (opcode 0x1)
    if (opcode === 0x1) {
      // 5. Extrai o payload (conteúdo da mensagem)
      const payload = extractPayload(frameBuffer, payloadLength, masked);
      
      // 6. Converte de JSON para objeto
      const message: SocketMessage = JSON.parse(payload.toString());
      
      // 7. Passa para o SocketHandler
      socketHandler.handleMessage(clientId, message);
    }
  }
});
```

#### 3. Servidor Processa a Mensagem (SocketHandler)

**Arquivo**: `nodejs/src/handlers/SocketHandler.ts`

```typescript
private async handleSendMessage(clientId: string, message: SocketMessage) {
  // 1. Verifica autenticação
  const client = this.clients.get(clientId);
  if (!client?.session) {
    return this.sendError(clientId, 'Not authenticated', message.request_id);
  }

  // 2. Valida dados obrigatórios
  const { chat_id, content } = message;
  if (!chat_id || !content) {
    return this.sendError(clientId, 'chat_id and content required', message.request_id);
  }

  // 3. Salva no banco de dados
  const msg = await messageService.sendMessage(chat_id, client.session.user_id, content);

  // 4. Envia confirmação para o remetente
  this.sendMessage(clientId, {
    status: 'ok',
    message_id: msg.id,
    timestamp: msg.timestamp,
    request_id: message.request_id  // Mesma ID da requisição original
  });

  // 5. Busca todos os participantes do chat
  const participants = await chatService.getChatParticipants(chat_id);

  // 6. Envia para cada participante online (broadcasting)
  for (const participant of participants) {
    const receiverClientId = this.userSessions.get(participant.id);
    if (receiverClientId) {
      this.sendMessage(receiverClientId, {
        type: 'message:new',
        payload: {
          id: msg.id,
          chat_session_id: chat_id,
          sender_id: msg.sender_id,
          sender_username: client.session.username,
          content: msg.content,
          timestamp: msg.timestamp
        }
      });
    }
  }
}
```

#### 4. Mensagem é Salva no Banco

**Arquivo**: `nodejs/src/services/index.ts` (messageService)

```typescript
async sendMessage(chatId: string, senderId: string, content: string) {
  // 1. Insere no banco
  const stmt = db.prepare(`
    INSERT INTO messages (chat_session_id, sender_id, content, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(chatId, senderId, content, new Date().toISOString());
  
  // 2. Retorna dados da mensagem criada
  return {
    id: result.lastInsertRowid,
    chat_session_id: chatId,
    sender_id: senderId,
    content: content,
    timestamp: new Date().toISOString()
  };
}
```

#### 5. Mensagem é Enviada aos Destinatários (Broadcasting)

**Processo de Broadcasting**:

1. **Servidor busca participantes**: `chatService.getChatParticipants(chat_id)`
2. **Para cada participante online**:
   - Encontra o `clientId` via `userSessions.get(participant.id)`
   - Cria mensagem do tipo `'message:new'`
   - Envia via WebSocket ou TCP (dependendo do protocolo do cliente)

#### 6. Cliente Recebe a Mensagem (Frontend)

**Arquivo**: `chat_frontend/lib/use-websocket.ts`

```typescript
// Evento 'message' do WebSocket
ws.onmessage = (event) => {
  try {
    const data: WebSocketResponse = JSON.parse(event.data);
    
    // 1. Se é resposta a uma requisição pendente
    if (data.request_id && pendingRequestsRef.current.has(data.request_id)) {
      const request = pendingRequestsRef.current.get(data.request_id)!;
      clearTimeout(request.timeoutId);
      pendingRequestsRef.current.delete(data.request_id);
      
      // Confirmação de envio bem-sucedido
      if (data.status === 'ok') {
        console.log('Message sent successfully:', data.message_id);
      }
    }
    
    // 2. Se é uma nova mensagem recebida
    else if (data.type === 'message:new') {
      // Atualiza o estado do chat
      setLastMessage(data);
      
      // Dispara callback para atualizar UI
      onMessageReceived?.(data.payload);
    }
    
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
};
```

#### 7. UI é Atualizada

**Arquivo**: `chat_frontend/components/chat-area.tsx`

```typescript
// Hook personalizado para gerenciar mensagens
const { messages, addMessage } = useChatMessages(chatId);

// Quando recebe nova mensagem
useEffect(() => {
  if (lastMessage?.type === 'message:new') {
    addMessage(lastMessage.payload);
  }
}, [lastMessage]);
```

### Diagrama do Fluxo Completo

```text
┌─────────────┐     WebSocket/TCP     ┌─────────────┐
│   Cliente   │ ────────────────────► │   Servidor  │
│  Frontend   │                       │  Backend    │
└─────────────┘                       └─────────────┘
       │                                     │
       │ 1. Usuário digita mensagem         │
       │    e clica "Enviar"                │
       │                                     │
       │                                     │
       ▼                                     ▼
┌─────────────┐     JSON Message       ┌─────────────┐
│ useWebSocket│ ────────────────────► │  server.ts  │
│    Hook     │                       │             │
└─────────────┘                       └─────────────┘
       │                                     │
       │ 2. Adiciona request_id             │
       │    ws.send(JSON.stringify(msg))    │
       │                                     │
       │                                     ▼
       │                           ┌─────────────┐
       │                           │SocketHandler│
       │                           │             │
       │                           └─────────────┘
       │                                     │
       │                                     │ 3. Valida autenticação
       │                                     │    e dados
       │                                     │
       │                                     ▼
       │                           ┌─────────────┐
       │                           │ message-    │
       │                           │ Service     │
       │                           └─────────────┘
       │                                     │
       │                                     │ 4. Salva no banco
       │                                     │
       │                                     ▼
       │                           ┌─────────────┐
       │                           │Broadcasting │
       │                           │             │
       │                           └─────────────┘
       │                                     │
       │                                     │ 5. Envia para todos
       │                                     │    os participantes
       │                                     │
       │                                     ▼
┌─────────────┐     message:new      ┌─────────────┐
│   Cliente   │ ◄─────────────────── │   Cliente   │
│     A       │                       │     B       │
└─────────────┘                       └─────────────┘
       │                                     │
       │ 6. Recebe via WebSocket            │
       │    Atualiza UI                     │
       │                                     │
       ▼                                     ▼
┌─────────────┐                       ┌─────────────┐
│  Chat UI    │                       │  Chat UI    │
│  Cliente A  │                       │  Cliente B  │
└─────────────┘                       └─────────────┘
```

### Tipos de Mensagens no Sistema

#### Mensagens de Comando (Cliente → Servidor)

```typescript
// Envio de mensagem de chat
{
  "type": "message",
  "chat_id": "chat_123",
  "content": "Olá, tudo bem?",
  "request_id": 42
}

// Login
{
  "type": "login", 
  "username": "joao",
  "password": "senha123",
  "request_id": 43
}
```

#### Mensagens de Evento (Servidor → Cliente)

```typescript
// Confirmação de envio
{
  "status": "ok",
  "message_id": "msg_456",
  "timestamp": "2025-11-09T10:30:00Z",
  "request_id": 42
}

// Nova mensagem recebida
{
  "type": "message:new",
  "payload": {
    "id": "msg_456",
    "chat_session_id": "chat_123", 
    "sender_id": "user_789",
    "sender_username": "maria",
    "content": "Oi João!",
    "timestamp": "2025-11-09T10:30:00Z"
  }
}
```

### Tratamento de Erros no Fluxo

```typescript
// Erro de autenticação
{
  "status": "error",
  "message": "Not authenticated",
  "request_id": 42
}

// Erro de validação
{
  "status": "error", 
  "message": "chat_id and content required",
  "request_id": 42
}
```

### Otimizações de Performance

1. **Broadcasting Eficiente**: Apenas participantes online recebem mensagens
2. **Confirmação Imediata**: Remetente recebe confirmação antes do broadcasting
3. **Armazenamento Persistente**: Mensagens são salvas no banco antes do envio
4. **Timeouts**: Requisições pendentes são limpas automaticamente
5. **Reconexão Automática**: Cliente reconecta automaticamente em caso de falha

## �🔄 Comunicação em Tempo Real

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
