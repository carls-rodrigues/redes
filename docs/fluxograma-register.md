# Fluxograma - Feature: Register

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Validação OK] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'register', username, password}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|register| O[SocketHandler.ts: handleRegister]

    O --> P{Validação}
    P -->|Username/password faltando| Q[sendError: 'Username and password required']
    P -->|OK| R[userService.getUserByUsername]

    R --> S{Usuário existe?}
    S -->|Sim| T[sendError: 'Username already exists']
    S -->|Não| U[userService.createUser]

    U --> V{Usuário criado?}
    V -->|Erro| W[sendError: 'Registration failed']
    V -->|Sucesso| X[userService.createSession]

    X --> Y[Criar sessão + atualizar client]
    Y --> Z["📥 Resposta: {status: 'ok', sessionId}"]

    %% Resposta retornando ao frontend
    Z --> AA[WebSocket onmessage]
    AA --> BB[websocket-context.tsx: onmessage]
    BB --> CC[Remover de pendingRequests]
    CC --> DD[Processar resposta]

    %% Conexões de erro
    Q --> DD
    T --> DD
    W --> DD
    D --> EE[Erro de conexão]
    K --> FF[Erro de timeout]
```

## Descrição do Fluxo de Registro

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "register",
  "username": "string",
  "password": "string",
  "requestId": "uuid"
}
```

### 📥 **Resposta (Backend → Frontend)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "sessionId": "string" // apenas em sucesso
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Valida dados e envia mensagem `register`
2. **Backend**: Recebe, valida, cria usuário e sessão
3. **Resposta**: Retorna status e dados da sessão
4. **Timeout**: 30 segundos para resposta

### ❌ **Tratamento de Erros**

- Username/password faltando
- Username já existe
- Erro na criação do usuário
- Timeout de 30 segundos
- Conexão WebSocket perdida

