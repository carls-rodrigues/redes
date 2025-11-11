# Fluxograma - Feature: Login

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Validação OK] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'login', username, password}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|login| O[SocketHandler.ts: handleLogin]

    O --> P{Validação}
    P -->|Username/password faltando| Q[sendError: 'Username and password required']
    P -->|OK| R[userService.getUserByUsername]

    R --> S{Usuário existe?}
    S -->|Não| T[sendError: 'Invalid credentials']
    S -->|Sim| U[userService.verifyPassword]

    U --> V{Senha válida?}
    V -->|Não| W[sendError: 'Invalid credentials']
    V -->|Sim| X[userService.createSession]

    X --> Y[Criar sessão + atualizar client]
    Y --> Z["📥 Resposta: {status: 'ok', sessionId, user}"]

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

## Descrição do Fluxo de Login

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "login",
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
  "sessionId": "string", // apenas em sucesso
  "user": {              // apenas em sucesso
    "id": "number",
    "username": "string"
  }
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Valida dados e envia mensagem `login`
2. **Backend**: Recebe, valida credenciais e cria sessão
3. **Resposta**: Retorna status, sessão e dados do usuário
4. **Timeout**: 30 segundos para resposta

### ❌ **Tratamento de Erros**

- Username/password faltando
- Credenciais inválidas (usuário não existe ou senha incorreta)
- Timeout de 30 segundos
- Conexão WebSocket perdida

