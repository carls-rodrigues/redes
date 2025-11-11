# Fluxograma - Feature: Search Users

```mermaid
flowchart TD
    %% Frontend - Socket Communication
    A[Frontend: Buscar usuários] --> B[websocket-context.tsx: sendMessage]
    B --> C{WebSocket conectado?}
    C -->|Não| D[Erro: Não conectado]
    C -->|Sim| E[Criar requestId + timeout 30s]

    E --> F[Enviar WebSocket Message]
    F --> G["📤 Mensagem: {type: 'search_users', query}"]
    G --> H[Adicionar à pendingRequests]

    %% Timeout handling
    E -.-> I[Timeout 30s]
    I --> J[Remover pendingRequests]
    J --> K[Definir erro timeout]

    %% Backend - Socket Processing
    F --> L[server.ts: onmessage]
    L --> M[SocketHandler.ts: handleMessage]
    M --> N{Message type}
    N -->|search_users| O[SocketHandler.ts: handleSearchUsers]

    O --> P{Cliente autenticado?}
    P -->|Não| Q[sendError: 'Not authenticated']
    P -->|Sim| R{Query válida?}
    R -->|Não| S[sendError: 'query must be a string']
    R -->|Sim| T[userService.searchUsers]

    T --> U[Buscar usuários no banco]
    U --> V["📥 Resposta: {status: 'ok', users: [...]}"]

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

## Descrição do Fluxo de Search Users

### 📤 **Mensagem Enviada (Frontend → Backend)**

```json
{
  "type": "search_users",
  "query": "string", // opcional, pode ser vazio para buscar todos
  "requestId": "uuid"
}
```

### 📥 **Resposta (Backend → Frontend)**

```json
{
  "status": "ok" | "error",
  "message": "string",
  "requestId": "uuid",
  "users": [
    {
      "id": "number",
      "username": "string"
    }
  ] // apenas em sucesso
}
```

### 🔄 **Fluxo WebSocket**

1. **Frontend**: Solicita busca de usuários enviando `search_users` com query
2. **Backend**: Valida autenticação e busca usuários no banco
3. **Resposta**: Retorna array de usuários que correspondem à busca
4. **Timeout**: 30 segundos para resposta

### 📝 **Regras de Busca**

- Query vazia: Retorna todos os usuários (exceto o próprio usuário)
- Query com texto: Busca usuários cujo username contenha o texto
- Case-insensitive: A busca não diferencia maiúsculas/minúsculas
- Exclui usuário atual: O próprio usuário não aparece nos resultados

### ❌ **Tratamento de Erros**

- Usuário não autenticado
- Query não é uma string
- Timeout de 30 segundos
- Conexão WebSocket perdida
- Erro na consulta ao banco de dados
