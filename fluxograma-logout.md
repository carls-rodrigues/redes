# Fluxograma - Feature: Logout

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Fazer logout] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'logout'}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|logout| O[SocketHandler.ts: handleLogout]

    O --> P{Cliente autenticado?}
    P -->|Não| Q[sendError: 'Not authenticated']
    P -->|Sim| R[userService.deleteSession]

    R --> S[Excluir sessão do banco]
    S --> T{Limpar dados do cliente}
    T --> U[Remover session do client]
    U --> V[Remover de userSessions]
    V --> W["📥 Resposta: {status: 'ok', message: 'Logged out successfully'}"]

    %% Resposta retornando ao frontend
    W --> X[WebSocket onmessage]
    X --> Y[websocket-context.tsx: onmessage]
    Y --> Z[Remover de pendingRequests]
    Z --> AA[Processar resposta]

    %% Conexões de erro
    Q --> AA
    D --> BB[Erro de conexão]
    K --> CC[Erro de timeout]
```

## Descrição do Fluxo de Logout

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "logout",
  "requestId": "uuid"
}
```

### 📥 **Resposta (Backend → Frontend)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "type": "logout"
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Solicita logout enviando `logout`
2. **Backend**: Valida autenticação e exclui sessão do banco
3. **Limpeza**: Remove dados de sessão do cliente e mapas internos
4. **Resposta**: Confirma logout bem-sucedido
5. **Timeout**: 30 segundos para resposta

### 🧹 **Limpeza de Sessão**

- Remove sessão do banco de dados
- Limpa `client.session` no servidor
- Remove entrada do `userSessions` map
- Cliente fica desautenticado

### ❌ **Tratamento de Erros**

- Usuário não autenticado
- Timeout de 30 segundos
- Conexão WebSocket perdida
- Erro ao excluir sessão do banco
