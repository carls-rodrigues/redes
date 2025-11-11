# Fluxograma - Feature: Get User Chats

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Carregar chats] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'get_user_chats'}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|get_user_chats| O[SocketHandler.ts: handleGetUserChats]

    O --> P{Cliente autenticado?}
    P -->|Não| Q[sendError: 'Not authenticated']
    P -->|Sim| R[chatService.getUserChats]

    R --> S[Buscar chats do usuário]
    S --> T["📥 Resposta: {status: 'ok', chats: [...]}"]

    %% Resposta retornando ao frontend
    T --> U[WebSocket onmessage]
    U --> V[websocket-context.tsx: onmessage]
    V --> W[Remover de pendingRequests]
    W --> X[Processar resposta]

    %% Conexões de erro
    Q --> X
    D --> Y[Erro de conexão]
    K --> Z[Erro de timeout]
```

## Descrição do Fluxo de Get User Chats

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "get_user_chats",
  "requestId": "uuid"
}
```

### 📥 **Resposta (Backend → Frontend)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "chats": [
    {
      "id": "number",
      "name": "string",
      "type": "dm" | "group",
      "created_at": "string",
      "updated_at": "string",
      "last_message": {
        "id": "number",
        "content": "string",
        "created_at": "string",
        "user_id": "number"
      }
    }
  ] // apenas em sucesso
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Solicita lista de chats enviando `get_user_chats`
2. **Backend**: Valida autenticação e busca todos os chats do usuário
3. **Resposta**: Retorna array com DMs e grupos do usuário
4. **Timeout**: 30 segundos para resposta

### ❌ **Tratamento de Erros**

- Usuário não autenticado
- Timeout de 30 segundos
- Conexão WebSocket perdida
- Erro na consulta ao banco de dados
