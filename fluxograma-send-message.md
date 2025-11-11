# Fluxograma - Feature: Send Message

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Enviar mensagem] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'send_message', chat_id, content}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|send_message| O[SocketHandler.ts: handleSendMessage]

    O --> P{Cliente autenticado?}
    P -->|Não| Q[sendError: 'Not authenticated']
    P -->|Sim| R{chat_id e content fornecidos?}
    R -->|Não| S[sendError: 'chat_id and content required']
    R -->|Sim| T[messageService.sendMessage]

    T --> U[Salvar mensagem no banco]
    U --> V[Criar objeto de mensagem completa]

    V --> W["📥 Confirmação: {status: 'ok', message: {...}}"]
    V --> X[Buscar participantes do chat]
    X --> Y[chatService.getChatParticipants]

    Y --> Z[Transmitir para todos os participantes]
    Z --> AA{Para cada participante}
    AA --> BB{Participante online?}
    BB -->|Sim| CC["📡 Broadcast: {type: 'message:new', message: {...}}"]
    BB -->|Não| DD[Pular - usuário offline]

    %% Resposta de confirmação retornando ao frontend
    W --> EE[WebSocket onmessage - remetente]
    EE --> FF[websocket-context.tsx: onmessage]
    FF --> GG[Remover de pendingRequests]
    GG --> HH[Processar confirmação]

    %% Mensagens broadcast retornando aos participantes
    CC --> II[WebSocket onmessage - participantes]
    II --> JJ[websocket-context.tsx: onmessage]
    JJ --> KK[Processar broadcast - sem request_id]

    %% Conexões de erro
    Q --> HH
    S --> HH
    D --> LL[Erro de conexão]
    K --> MM[Erro de timeout]
```

## Descrição do Fluxo de Send Message

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "send_message",
  "chat_id": "number",
  "content": "string",
  "requestId": "uuid"
}
```

### 📥 **Confirmação (Backend → Remetente)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "message": {
    "id": "number",
    "chat_id": "number",
    "user_id": "number",
    "content": "string",
    "created_at": "string",
    "updated_at": "string"
  } // apenas em sucesso
}
```

### 📡 **Broadcast (Backend → Participantes)**

```json
{
  "type": "message:new",
  "message": {
    "id": "number",
    "chat_id": "number",
    "user_id": "number",
    "content": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Envia mensagem `send_message` com conteúdo
2. **Backend**: Valida, salva no banco e confirma para remetente
3. **Broadcast**: Envia `message:new` para todos os participantes online
4. **Timeout**: 30 segundos para confirmação

### ❌ **Tratamento de Erros**

- Usuário não autenticado
- chat_id ou content não fornecidos
- Timeout de 30 segundos
- Conexão WebSocket perdida
- Erro ao salvar no banco de dados

