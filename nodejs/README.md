# Redes Backend - Node.js Socket Server

Backend reescrito em Node.js com TypeScript para melhor performance de mensagens em tempo real.

## Estrutura do Projeto

```
nodejs/
├── src/
│   ├── database/
│   │   └── Database.ts       # Gerenciador SQLite com better-sqlite3
│   ├── services/
│   │   └── index.ts          # UserService, ChatService, MessageService
│   ├── handlers/
│   │   └── SocketHandler.ts  # Manipulador de mensagens do socket
│   ├── types/
│   │   └── index.ts          # Interfaces TypeScript
│   ├── server.ts             # Servidor socket principal
│   └── index.ts              # Exportações principais
├── tsconfig.json             # Configuração TypeScript
├── package.json              # Dependências
├── .env                      # Variáveis de ambiente
└── README.md                 # Este arquivo
```

## Instalação

```bash
cd nodejs
npm install
```

## Configuração

Edite o arquivo `.env`:

```env
DATABASE_PATH=./database.sqlite
SOCKET_PORT=5000
NODE_ENV=development
```

## Executar

### Development (com watch mode)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Protocolo de Comunicação

### Mensagens do Cliente

Todas as mensagens são JSON. O servidor espera objetos com estrutura:

```typescript
interface SocketMessage {
  type: string;
  [key: string]: any;
}
```

### Operações Suportadas

#### 1. Registrar (Register)
```json
{
  "type": "register",
  "username": "usuario",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "status": "registered",
  "user_id": "uuid",
  "username": "usuario",
  "session_id": "uuid"
}
```

#### 2. Fazer Login
```json
{
  "type": "login",
  "username": "usuario",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "status": "ok",
  "user_id": "uuid",
  "username": "usuario",
  "session_id": "uuid"
}
```

#### 3. Obter Chats do Usuário
```json
{
  "type": "get_user_chats"
}
```

**Resposta:**
```json
{
  "status": "ok",
  "chats": [
    {
      "id": "chat_uuid",
      "type": "direct_message",
      "participants": [...],
      "last_message": {...},
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 4. Obter Mensagens de um Chat
```json
{
  "type": "get_messages",
  "chat_id": "uuid"
}
```

**Resposta:**
```json
{
  "status": "ok",
  "messages": [
    {
      "id": "msg_uuid",
      "sender_id": "user_uuid",
      "content": "Olá!",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 5. Enviar Mensagem
```json
{
  "type": "message",
  "chat_id": "uuid",
  "content": "Olá pessoal!"
}
```

**Resposta (ao remetente):**
```json
{
  "status": "ok",
  "message_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Notificação (aos outros participantes):**
```json
{
  "chat_id": "uuid",
  "message": {
    "id": "msg_uuid",
    "sender_id": "user_uuid",
    "sender_username": "usuario",
    "content": "Olá pessoal!",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Respostas de Erro

```json
{
  "status": "error",
  "message": "Descrição do erro"
}
```

## Integração com Frontend Python

Atualize o `socket_client.py` para conectar ao novo servidor:

```python
import socket
import json

class SocketClient:
    def __init__(self, host='localhost', port=5000):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect((host, port))
    
    def send(self, message: dict):
        data = json.dumps(message).encode()
        self.socket.send(data)
    
    def receive(self) -> dict:
        data = self.socket.recv(4096)
        return json.loads(data.decode())
```

## Performance

- ✅ Sem polling - Comunicação por socket verdadeira em tempo real
- ✅ better-sqlite3 - Queries síncronas eficientes
- ✅ WAL mode - SQLite com melhor concorrência
- ✅ Índices otimizados - Queries rápidas em mensagens
- ✅ Type-safe - TypeScript evita erros em runtime

## Próximas Melhorias

- [ ] Suporte a grupos
- [ ] Reconhecimento de leitura
- [ ] Digitação em tempo real
- [ ] Compartilhamento de arquivos
- [ ] Autenticação com tokens JWT
- [ ] Rate limiting
- [ ] Message queuing para usuários offline
