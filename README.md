# 🎯 RedES Chat

Um aplicativo de chat em tempo real desenvolvido para a turma com **Electron**, **React**, **Node.js** e **WebSockets**.

## 🚀 Começar Rapidamente

### Backend + Web Interface

```bash
cd nodejs
npm run build
node dist/server.js
```

**Open your browser:** http://localhost:8080

### Desktop App (Electron)

```bash
cd electron
npm run dev
```

## 🌐 Usando na Rede da Faculdade

Para conectar múltiplos computadores na rede da faculdade:

### 1. Configurar Servidor
```bash
cd electron
# Linux/Mac
./setup-network.sh

# Windows
setup-network.bat
```

### 2. Configurar Clientes
Cada colega deve copiar o arquivo `.env` gerado e executar:
```bash
# Linux/Mac
source .env && npm run dev

# Windows
call .env.bat && npm run dev
```

## 📖 Guia Completo

Para instruções detalhadas, veja: **[SETUP.md](./SETUP.md)**

## 🎨 Arquitetura

```
┌─────────────────────┐
│    Electron App     │  ← Frontend (React + TypeScript)
│    (Seu Desktop)    │     Localhost ou IP remoto
└──────────┬──────────┘
           │
       Port 5000 (WebSocket)
           │
┌──────────▼──────────┐
│   Node.js Backend   │  ← Servidor (Express + Socket.io)
│   (localhost:5000)  │     Banco de dados SQLite
└─────────────────────┘
```

## ✨ Recursos

- ✅ Chat em tempo real com WebSockets
- ✅ Autenticação com senha criptografada
- ✅ Múltiplas conversas
- ✅ Design system profissional (shadcn/ui)
- ✅ Dark mode & Light mode
- ✅ Menu de opções por conversa
- ✅ Busca de conversas
- ✅ Banco de dados persistente

## 🎯 Funcionalidades do Chat

### Menu de Opções (3 pontos ⋯)

- 🔔 **Mute notifications** - Silenciar notificações
- 📦 **Archive conversation** - Arquivar conversa
- 🗑️ **Clear chat** - Limpar histórico
- ❌ **Delete conversation** - Deletar conversa

### Navegação

- 🔍 Barra de busca para encontrar conversas
- 💬 Lista de conversas ativas
- 📊 Contador de participantes
- 👤 Informações de perfil

## 🔧 Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Electron, React 18, TypeScript, Tailwind CSS |
| **UI** | shadcn/ui, Radix UI, Lucide Icons |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | SQLite com better-sqlite3 |
| **Auth** | bcryptjs (hash seguro) |
| **Build** | Vite (Frontend), TypeScript (Backend) |
| **Container** | Docker & Docker Compose |

## 📋 Requisitos

- **Node.js** v18+ ([Baixar](https://nodejs.org/))
- **Git** ([Baixar](https://git-scm.com/))

## 🚀 Iniciar

### Opção 1: Script Automático (Recomendado)

```bash
# Windows
setup.bat

# Linux/macOS
./setup.sh
```

### Opção 2: Manual

**Terminal 1 - Backend:**
```bash
cd nodejs
npm install
npm run build
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd electron
npm install
npm run dev
```

## 🌐 Conectar em Rede Local

Seus colegas podem se conectar ao seu app se estiverem na mesma rede:

1. Descubra seu IP local:
   - **Windows**: `ipconfig` (IPv4 Address)
   - **Linux/Mac**: `ifconfig` (inet addr)

2. Seu colega conecta a: `http://SEU_IP:5000`

Veja [SETUP.md](./SETUP.md) para mais detalhes.

## 🐳 Deploy com Docker

```bash
# Inicie o backend com Docker
docker-compose up -d

# Veja os logs
docker-compose logs -f backend

# Pare
docker-compose down
```

Veja [DOCKER.md](./DOCKER.md) para mais informações.

## 📁 Estrutura

```
redes/
├── electron/              # 🎨 Frontend Electron + React
│   ├── src/
│   │   ├── renderer/      # Componentes React
│   │   │   ├── components/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── main/          # Processo principal Electron
│   ├── package.json
│   └── tsconfig.json
├── nodejs/                # 🔧 Backend Node.js
│   ├── src/
│   │   ├── server.ts      # Servidor principal
│   │   ├── database/      # DB operations
│   │   ├── handlers/      # Socket handlers
│   │   ├── routes/        # Express routes
│   │   └── types/         # TypeScript types
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── design/                # 🎨 Design System
│   └── code/
│       ├── components/    # shadcn/ui
│       └── package.json
├── SETUP.md               # 📖 Guia de configuração
├── DOCKER.md              # 🐳 Documentação Docker
├── setup.sh               # 🔧 Setup Linux/Mac
├── setup.bat              # 🔧 Setup Windows
└── docker-compose.yml     # 📦 Docker config
```

## 🆘 Troubleshooting

### Porta 5000 em uso

```bash
# Linux/Mac
lsof -i :5000

# Windows
netstat -ano | findstr :5000
```

### Dependências faltando

```bash
cd nodejs && npm install && npm run build
cd ../electron && npm install
```

### App não abre

```bash
cd electron
npm run dev
# Se não abrir, tente:
npx electron .
```

### Não consegue conectar ao backend

- ✓ Backend está rodando? (`npm run dev` em nodejs/)
- ✓ Porta 5000 está acessível?
- ✓ Firewall bloqueando?

## 🤝 Contribuindo

Tem ideias? Encontrou um bug? Quer adicionar features?

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit: `git commit -m "add: descrição"`
3. Push: `git push origin feature/minha-feature`
4. Abra um Pull Request

## 📚 Ideias Futuras

- [ ] Grupos de chat
- [ ] Compartilhamento de arquivos/imagens
- [ ] Videochamadas
- [ ] Notificações desktop
- [ ] Sincronização com nuvem
- [ ] Busca avançada de mensagens
- [ ] Reações a mensagens
- [ ] Typing indicator ("Está digitando...")
- [ ] Read receipts (visto/entregue)
- [ ] Perfis de usuário customizados

## 📝 Licença

MIT - Use livremente para fins educacionais

## 👥 Time

Desenvolvido pela turma para a turma! 🎓

---

**Dúvidas?** Veja [SETUP.md](./SETUP.md) ou abra uma issue no repositório.

**Vamos conversar!** 💬
