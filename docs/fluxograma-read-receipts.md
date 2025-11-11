# Fluxograma - Feature: Read Receipts (Confirmações de Leitura)

```mermaid
flowchart TD
    %% Frontend - User Interaction
    A[Usuário abre conversa] --> B[ChatArea: loadMessages()]
    B --> C[sendMessage: get_messages]
    C --> D["📤 Mensagem: {type: 'get_messages', chat_id}"]

    %% Backend - Message Loading
    D --> E[server.ts: onmessage]
    E --> F[SocketHandler.ts: handleMessage]
    F --> G{Message type}
    G -->|get_messages| H[messageService.getMessages]

    H --> I[getMessages(chatId, userId)]
    I --> J["UPDATE messages SET read_at = ?, read_by = ? WHERE chat_session_id = ? AND sender_id != ? AND read_at IS NULL"]

    J --> K[Executar query de mensagens]
    K --> L["SELECT m.*, u.username FROM messages m JOIN users u ON m.sender_id = u.id WHERE chat_session_id = ? ORDER BY timestamp DESC"]

    L --> M[Retornar mensagens com read_at/read_by]
    M --> N["📥 Resposta: {status: 'ok', messages: [...]}"]

    %% Frontend - Message Processing
    N --> O[ChatArea: onmessage]
    O --> P[setMessages(messages)]
    P --> Q[markMessagesAsRead() após 100ms]

    Q --> R[Filtrar mensagens não lidas de outros]
    R --> S["unreadMessageIds = messages.filter(msg => msg.sender_id !== currentUser.id && !read_by.includes(currentUser.id))"]

    S --> T{Encontrou mensagens não lidas?}
    T -->|Sim| U[sendMessage: mark_read]
    T -->|Não| V[Finalizar]

    U --> W["📤 Mensagem: {type: 'mark_read', message_ids: [...], chat_id, user_id}"]

    %% Backend - Mark as Read Processing
    W --> X[SocketHandler.ts: handleMessage]
    X --> Y{Message type}
    Y -->|mark_read| Z[messageService.markMessagesAsRead]

    Z --> AA[Para cada messageId]
    AA --> BB["UPDATE messages SET read_by = JSON_ARRAY_APPEND(read_by, '$', ?) WHERE id = ?"]

    BB --> CC[Atualizar read_at se necessário]
    CC --> DD["📥 Resposta: {status: 'ok', read_updates: [...]}"]

    %% Frontend - UI Update
    DD --> EE[ChatArea: onmessage type='messages_read']
    EE --> FF[Atualizar mensagens com read_by/read_at]
    FF --> GG[Re-renderizar ChatMessage com checkmarks]

    %% ChatMessage Component
    GG --> HH[ChatMessage: render]
    HH --> II{Mensagem do usuário atual?}
    II -->|Sim| JJ{isRead = true?}
    II -->|Não| KK[Sem indicadores de leitura]

    JJ -->|Sim| LL[Duplo checkmark azul ✅✅]
    JJ -->|Não| MM[Checkmark cinza ✅]

    %% Database Schema
    subgraph "Database Schema"
        NN[messages table]
        NN --> OO["id, chat_session_id, sender_id, content, timestamp"]
        NN --> PP["read_at: TIMESTAMP NULL"]
        NN --> QQ["read_by: JSON ARRAY of user_ids"]
    end

    %% Error Handling
    J -.-> RR[Database error]
    RR --> SS["📥 Resposta: {status: 'error', message: 'Database error'}"]

    BB -.-> TT[Update error]
    TT --> UU["📥 Resposta: {status: 'error', message: 'Failed to mark as read'}"]
```

## 📋 Estrutura das Mensagens

### 📤 **Mensagem Enviada - Carregar Mensagens**
```json
{
  "type": "get_messages",
  "request_id": "uuid-v4",
  "chat_id": "chat-session-id"
}
```

### 📥 **Resposta - Mensagens Carregadas**
```json
{
  "status": "ok",
  "request_id": "uuid-v4",
  "messages": [
    {
      "id": "msg-123",
      "chat_session_id": "chat-456",
      "sender_id": "user-789",
      "sender_username": "johndoe",
      "content": "Olá, tudo bem?",
      "timestamp": "2025-11-11T10:00:00.000Z",
      "read_at": "2025-11-11T10:05:00.000Z",
      "read_by": "[\"user-101\"]"
    }
  ]
}
```

### 📤 **Mensagem Enviada - Marcar como Lida**
```json
{
  "type": "mark_read",
  "request_id": "uuid-v4",
  "message_ids": ["msg-123", "msg-124"],
  "chat_id": "chat-456",
  "user_id": "user-101"
}
```

### 📥 **Resposta - Confirmação de Leitura**
```json
{
  "status": "ok",
  "request_id": "uuid-v4",
  "read_updates": [
    {
      "message_id": "msg-123",
      "read_by": "[\"user-101\"]",
      "read_at": "2025-11-11T10:05:00.000Z"
    }
  ]
}
```

## 🔄 Fluxo de Funcionamento

### 1. **Carregamento Automático**

- Quando usuário abre uma conversa → `getMessages(chatId, userId)` é chamado
- Backend automaticamente marca mensagens de outros usuários como lidas
- `read_at` e `read_by` são atualizados no banco

### 2. **Marcação Manual**

- Frontend identifica mensagens não lidas após carregamento
- Envia `mark_read` para mensagens específicas
- Backend atualiza `read_by` array com ID do usuário

### 3. **Atualização em Tempo Real**

- Outros participantes recebem `messages_read` via WebSocket
- UI é atualizada com novos status de leitura
- Checkmarks mudam de cinza para azul

## 📊 Estados de Leitura

| Estado | Visual | Significado |
|--------|--------|-------------|
| Não enviada | - | Mensagem ainda não enviada |
| Enviada | ✅ (cinza) | Mensagem enviada, não lida |
| Lida | ✅✅ (azul) | Pelo menos um destinatário leu |

## 🛠️ Lógica de Negócio

### **Regras de Leitura:**

- ✅ Usuário não vê "lida" nas próprias mensagens
- ✅ Apenas mensagens de outros usuários podem ser marcadas como lidas
- ✅ `read_by` é um array JSON de user_ids
- ✅ `read_at` é timestamp da primeira leitura
- ✅ Mensagens são marcadas automaticamente ao abrir conversa

### **Broadcast:**

- ✅ Quando usuário marca mensagens como lidas
- ✅ Outros participantes recebem atualização em tempo real
- ✅ UI é atualizada sem reload da página

## 🐛 Tratamento de Erros

### **Cenários de Falha:**

- ❌ Database connection error → `status: 'error'`
- ❌ Invalid message_ids → `status: 'error'`
- ❌ User not authenticated → `status: 'error'`
- ❌ Chat not found → `status: 'error'`

### **Fallback:**

- ✅ Se `mark_read` falha, mensagens permanecem não lidas
- ✅ Frontend pode tentar novamente após timeout
- ✅ Estado local é mantido até confirmação do servidor

## 📈 Performance

### **Otimizações:**

- ✅ Query única para carregar mensagens + marcar como lidas
- ✅ `JSON_ARRAY_APPEND` para atualizar read_by eficientemente
- ✅ Índices no banco para queries rápidas
- ✅ Debounce de 100ms para evitar spam de requests

### **Limitações:**

- ⚠️ Read receipts só funcionam para conversas abertas
- ⚠️ Não há histórico de "quem leu quando"
- ⚠️ Array JSON limitado a ~100 usuários por mensagem
