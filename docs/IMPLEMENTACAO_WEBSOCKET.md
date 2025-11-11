# 📡 Implementação WebSocket no Backend

## Visão Geral da Arquitetura

O backend implementa um servidor WebSocket híbrido que suporta tanto conexões WebSocket  
padrão quanto conexões TCP brutas. A arquitetura é projetada para comunicação em tempo real  
bidirecional entre o frontend React/Next.js e o backend Node.js.

## 🏗️ Componentes Principais

### 1. **Servidor Principal (`server.ts`)**

#### Detecção Automática de Protocolo

```typescript
const server = net.createServer((socket) => {
  // Detecta automaticamente se é WebSocket ou TCP bruto
  const detectProtocol = (data: Buffer) => {
    if (dataStr.startsWith('GET ')) {
      handleWebSocketUpgrade(socket, buffer, clientId);
    } else {
      handleRawTcpConnection(socket, buffer, clientId);
    }
  };
});
```

#### Handshake WebSocket (RFC 6455)

```typescript
// Gera token de aceitação conforme RFC 6455
const acceptToken = crypto
  .createHash('sha1')
  .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
  .digest('base64');

// Resposta HTTP 101 Switching Protocols
const response = [
  'HTTP/1.1 101 Switching Protocols',
  'Upgrade: websocket',
  'Connection: Upgrade',
  `Sec-WebSocket-Accept: ${acceptToken}`,
].join('\r\n');
```

#### Processamento de Frames WebSocket

```typescript
// Analisa cabeçalho do frame
const fin = (byte1 & 0x80) >> 7;
const opcode = byte1 & 0x0f;
const masked = (byte2 & 0x80) >> 7;

// Desmascara payload (RFC 6455)
for (let i = 0; i < payloadLen; i++) {
  payload[i] ^= maskingKey[i % 4];
}
```

### 2. **Gerenciador de Conexões (`SocketHandler.ts`)**

#### Estrutura de Cliente

```typescript
interface ClientInfo {
  userId?: string;
  socket: Socket;
  session?: Session;
  isWebSocket?: boolean;
  sendMessage?: (message: any) => void;
}
```

#### Gerenciamento de Estado

```typescript
private clients: Map<string, ClientInfo> = new Map();
private userSessions: Map<string, string> = new Map(); // userId -> clientId
```

#### Roteamento de Mensagens

```typescript
async handleMessage(clientId: string, message: SocketMessage) {
  switch (message.type) {
    case 'login': await this.handleLogin(clientId, message); break;
    case 'register': await this.handleRegister(clientId, message); break;
    case 'message': await this.handleSendMessage(clientId, message); break;
    // ... outros casos
  }
}
```

## 📨 Protocolo de Comunicação

### Estrutura das Mensagens

#### Mensagem Enviada (Frontend → Backend)

```json
{
  "type": "message_type",
  "request_id": "uuid-v4",
  "param1": "value1",
  "param2": "value2"
}
```

#### Resposta (Backend → Frontend)

```json
{
  "status": "ok" | "error",
  "request_id": "uuid-v4",  // corresponde à solicitação
  "message": "descrição do erro", // apenas em erro
  "data": { ... } // dados da resposta
}
```

### Tipos de Mensagem Suportados

| Tipo | Descrição | Parâmetros |
|------|-----------|------------|
| `auth` | Autenticação com token | `token` |
| `login` | Login de usuário | `username`, `password` |
| `register` | Registro de usuário | `username`, `password` |
| `get_user_chats` | Lista conversas do usuário | - |
| `get_messages` | Busca mensagens | `chat_id` |
| `message` | Envia mensagem | `chat_id`, `content` |
| `search_users` | Busca usuários | `query` |
| `create_dm` | Cria DM | `other_user_id` |
| `create_group` | Cria grupo | `group_name`, `member_ids` |
| `logout` | Logout | - |

## 🔄 Fluxo de Comunicação

### 1. **Estabelecimento da Conexão**

```text
Frontend (Browser)          Backend (Node.js)
      |                           |
      |  WebSocket Connect        |
      |-------------------------->|
      |                           |
      |  HTTP 101 Switching       |
      |<--------------------------|
      |                           |
      |  WebSocket Connected      |
      |===========================|
```

### 2. **Handshake Detalhado**

```text
1. Browser envia requisição HTTP com headers:
   GET /ws HTTP/1.1
   Host: localhost:5000
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
   Sec-WebSocket-Version: 13

2. Server calcula chave de aceitação:
   base64(sha1(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))

3. Server responde:
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### 3. **Troca de Mensagens**

```text
Frontend                    Backend
   |                           |
   |  JSON Message             |
   |  (Masked Frame)           |
   |-------------------------->|
   |                           |
   |  Process Message          |
   |  Validate & Execute       |
   |                           |
   |  JSON Response            |
   |  (Unmasked Frame)         |
   |<--------------------------|
   |                           |
   |  Update UI                |
   |===========================|
```

## 🛡️ Tratamento de Erros

### Timeout de Solicitações

```typescript
// Timeout de 30 segundos por solicitação
const timeoutId = setTimeout(() => {
  pendingRequestsRef.current.delete(requestId);
  setLastMessage({
    type: message.type,
    request_id: requestId,
    status: 'error',
    message: 'Solicitação expirou'
  });
}, config.current.requestTimeout);
```

### Validação de Autenticação

```typescript
const client = this.clients.get(clientId);
if (!client?.session) {
  return this.sendError(clientId, 'Not authenticated', message.request_id);
}
```

### Tratamento de Conexões Perdidas

```typescript
socket.on('error', (err: any) => {
  if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
    console.error(`WebSocket error for ${clientId}:`, err);
  }
  handler.unregisterClient(clientId);
});
```

## 📊 Gerenciamento de Estado

### Sessões de Usuário

```typescript
// Mapa: userId -> clientId (para broadcast)
private userSessions: Map<string, string> = new Map();

// Verifica se usuário está online
isUserOnline(userId: string): boolean {
  return this.userSessions.has(userId);
}
```

### Broadcast para Múltiplos Participantes

```typescript
// Exemplo: notificar membros de grupo
for (const memberId of allMembers) {
  const memberClientId = this.userSessions.get(memberId);
  if (memberClientId) {
    this.sendMessage(memberClientId, {
      type: 'group:created',
      payload: group
    });
  }
}
```

## 🔧 Funcionalidades Avançadas

### Ping/Pong (Keep-Alive)

```typescript
if (opcode === 0x9) {
  // Ping - responder com Pong
  const pongFrame = Buffer.from([0x8a, 0x00]);
  socket.write(pongFrame);
}
```

### Suporte Híbrido (WebSocket + TCP)

```typescript
// Mesma API para ambos os protocolos
private sendMessage(clientId: string, data: any) {
  const client = this.clients.get(clientId);
  if (client.isWebSocket && client.sendMessage) {
    client.sendMessage(data); // WebSocket
  } else {
    client.socket.write(JSON.stringify(data) + '\n'); // TCP
  }
}
```

### Logging Estruturado

```typescript
console.log(`[${new Date().toISOString()}] 🔄 Processing ${message.type} ` +
  `from client ${clientId}`);
console.log(`[${new Date().toISOString()}] ✅ Mensagem processada: ${message.type}`);
```

## 🚀 Performance e Escalabilidade

### Otimizações Implementadas

1. **Buffers Eficientes**: Processamento de frames WebSocket sem alocação excessiva
2. **Mapas de Hash**: O(1) para lookups de clientes e sessões
3. **Conexões Persistentes**: Uma conexão por cliente, multiplexada
4. **Timeouts Automáticos**: Limpeza de solicitações pendentes
5. **Graceful Shutdown**: Encerramento ordenado do servidor

### Limitações Atuais

- **Single Thread**: Node.js single-threaded (pode ser bottleneck)
- **Memory**: Todas as conexões mantidas em memória
- **No Clustering**: Não distribuído entre múltiplos processos

## 🔍 Debugging e Monitoramento

### Logs Estruturados

```text
[2025-11-11T10:00:00.000Z] 🔌 Atualização WebSocket iniciada
[2025-11-11T10:00:00.001Z] ✅ Handshake WebSocket concluído
[2025-11-11T10:00:00.002Z] 📨 Mensagem recebida: login
[2025-11-11T10:00:00.003Z] 🔄 Processing login from client abc-123
[2025-11-11T10:00:00.004Z] ✅ Mensagem processada: login
```

### Métricas Disponíveis

- Número de clientes conectados
- Taxa de mensagens por segundo
- Tempo médio de resposta
- Taxa de erros por tipo de mensagem

## 📚 Referências

- **RFC 6455**: The WebSocket Protocol
- **RFC 2616**: HTTP/1.1 Protocol
- **Node.js Documentation**: Net Module
- **SQLite Documentation**: Better SQLite3

---

**🎯 Esta implementação fornece uma base sólida para comunicação em tempo real,**  
**com suporte completo ao protocolo WebSocket e extensibilidade para novos tipos de mensagem.**
