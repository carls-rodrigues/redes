# Fluxograma - Feature: Create Group

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Criar grupo] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'create_group', group_name, member_ids}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|create_group| O[SocketHandler.ts: handleCreateGroup]

    O --> P{Cliente autenticado?}
    P -->|Não| Q[sendError: 'Not authenticated']
    P -->|Sim| R{group_name e member_ids fornecidos?}
    R -->|Não| S[sendError: 'group_name and member_ids required']
    R -->|Sim| T[chatService.createGroup]

    T --> U[Criar grupo no banco]
    U --> V["📥 Resposta: {status: 'ok', group: {...}}"]

    V --> W[Notificar todos os membros]
    W --> X["📡 Broadcast: {type: 'group:created', payload: group}"]

    %% Resposta retornando ao frontend
    V --> Y[WebSocket onmessage - criador]
    Y --> Z[websocket-context.tsx: onmessage]
    Z --> AA[Remover de pendingRequests]
    AA --> BB[Processar resposta]

    %% Broadcast retornando aos membros
    X --> CC[WebSocket onmessage - membros]
    CC --> DD[websocket-context.tsx: onmessage]
    DD --> EE[Processar broadcast - sem request_id]

    %% Conexões de erro
    Q --> BB
    S --> BB
    D --> FF[Erro de conexão]
    K --> GG[Erro de timeout]
```

## Descrição do Fluxo de Create Group

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "create_group",
  "group_name": "string",
  "member_ids": ["number"],
  "requestId": "uuid"
}
```

### 📥 **Resposta (Backend → Criador)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "group": {
    "id": "number",
    "name": "string",
    "type": "group",
    "created_by": "number",
    "created_at": "string",
    "updated_at": "string"
  } // apenas em sucesso
}
```

### 📡 **Broadcast (Backend → Todos os Membros)**

```json
{
  "type": "group:created",
  "payload": {
    "id": "number",
    "name": "string",
    "type": "group",
    "created_by": "number",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Solicita criação de grupo enviando `create_group` com nome e membros
2. **Backend**: Valida autenticação, cria grupo no banco de dados
3. **Resposta**: Retorna detalhes do grupo criado para o criador
4. **Broadcast**: Notifica todos os membros sobre o novo grupo
5. **Timeout**: 30 segundos para resposta

### ❌ **Tratamento de Erros**

- Usuário não autenticado
- group_name ou member_ids não fornecidos
- Timeout de 30 segundos
- Conexão WebSocket perdida
- Erro na criação do grupo
