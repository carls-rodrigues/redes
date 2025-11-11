# Fluxograma - Feature: Get Messages

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Solicitar mensagens] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'get_messages', chat_id}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|get_messages| O[SocketHandler.ts: handleGetMessages]

    O --> P{Cliente autenticado?}
    P -->|Não| Q[sendError: 'Not authenticated']
    P -->|Sim| R{chat_id fornecido?}
    R -->|Não| S[sendError: 'chat_id required']
    R -->|Sim| T[messageService.getMessages]

    T --> U[Buscar mensagens do banco]
    U --> V["📥 Resposta: {status: 'ok', messages: [...]}"]

    %% Resposta retornando ao frontend
    V --> W[WebSocket onmessage]
    W --> X[websocket-context.tsx: onmessage]
    X --> Y[Remover de pendingRequests]
    Y --> Z[Processar resposta]

    %% Conexões de erro
    Q --> Z
    S --> Z
    D --> AA[Erro de conexão]
    K --> BB[Erro de timeout]
```

## Descrição do Fluxo de Get Messages

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "get_messages",
  "chat_id": "number",
  "requestId": "uuid"
}
```

### 📥 **Resposta (Backend → Frontend)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "messages": [
    {
      "id": "number",
      "chat_id": "number",
      "user_id": "number",
      "content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ] // apenas em sucesso
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Solicita mensagens enviando `get_messages` com `chat_id`
2. **Backend**: Valida autenticação e `chat_id`, busca mensagens no banco
3. **Resposta**: Retorna array de mensagens ou erro
4. **Timeout**: 30 segundos para resposta

### ❌ **Tratamento de Erros**

- Usuário não autenticado
- chat_id não fornecido
- Timeout de 30 segundos
- Conexão WebSocket perdida
- Erro na consulta ao banco de dados

