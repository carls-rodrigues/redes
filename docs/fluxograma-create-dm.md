# Fluxograma - Feature: Create DM (Conversa Direta)

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Criar DM] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'create_dm', other_user_id}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|create_dm| O[SocketHandler.ts: handleCreateDM]

    O --> P{Cliente autenticado?}
    P -->|Não| Q[sendError: 'Not authenticated']
    P -->|Sim| R{other_user_id fornecido?}
    R -->|Não| S[sendError: 'other_user_id required']
    R -->|Sim| T[chatService.createOrGetDM]

    T --> U{Criar ou obter DM existente}
    U --> V[Criar nova conversa ou retornar existente]
    V --> W[chatService.getChat - obter detalhes]
    W --> X[chatService.getChatParticipants]

    X --> Y[Construir resposta com chat e participantes]
    Y --> Z["📥 Resposta: {status: 'ok', chat: {...}, participants: [...]}"]

    %% Resposta retornando ao frontend
    Z --> AA[WebSocket onmessage]
    AA --> BB[websocket-context.tsx: onmessage]
    BB --> CC[Remover de pendingRequests]
    CC --> DD[Processar resposta]

    %% Conexões de erro
    Q --> DD
    S --> DD
    D --> EE[Erro de conexão]
    K --> FF[Erro de timeout]
```

## Descrição do Fluxo de Create DM

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "create_dm",
  "other_user_id": "number",
  "requestId": "uuid"
}
```

### 📥 **Resposta (Backend → Frontend)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "chat": {
    "id": "number",
    "name": "string",
    "type": "dm",
    "created_at": "string",
    "updated_at": "string"
  }, // apenas em sucesso
  "participants": [
    {
      "id": "number",
      "username": "string"
    }
  ] // apenas em sucesso
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Solicita criação de DM enviando `create_dm` com `other_user_id`
2. **Backend**: Valida autenticação, cria ou obtém DM existente
3. **Resposta**: Retorna detalhes do chat e participantes
4. **Timeout**: 30 segundos para resposta

### ❌ **Tratamento de Erros**

- Usuário não autenticado
- other_user_id não fornecido
- Timeout de 30 segundos
- Conexão WebSocket perdida
- Erro na criação/obtenção do chat

