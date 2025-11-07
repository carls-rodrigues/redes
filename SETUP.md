# 🚀 RedES Chat - Guia de Instalação e Uso

Bem-vindo ao RedES Chat! Este é um aplicativo de chat em tempo real desenvolvido com Electron, React e Node.js.

## 📋 Requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior) - [Baixar aqui](https://nodejs.org/)
- **Git** - [Baixar aqui](https://git-scm.com/)
- **npm** (vem com Node.js)

## 🔧 Instalação

### 1. Clone o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd redes
```

### 2. Instale as Dependências do Backend

```bash
cd nodejs
npm install
npm run build
```

### 3. Instale as Dependências do Electron (Frontend)

```bash
cd ../electron
npm install
```

## 🎯 Como Usar

### Opção 1: Interface Web (Recomendado para Faculdade)

Esta é a opção mais simples para usar na rede da faculdade:

```bash
cd nodejs
npm run build
node dist/server.js
```

**Abra no navegador:** http://localhost:8080 (ou o IP do servidor na rede)

**Para colegas na mesma rede:**
- Substitua `localhost` pelo IP da máquina do servidor
- Exemplo: `http://192.168.1.100:8080`

### Opção 2: Desenvolvimento Local (Desktop App)

Abra **dois terminais** - um para o backend e outro para o frontend:

#### Terminal 1 - Servidor Backend

```bash
cd nodejs
npm run dev
```

Você verá algo como:
```
Server running on port 5000
Socket server ready for connections
```

#### Terminal 2 - Electron App

```bash
cd electron
npm run dev
```

Isso abrirá a janela do Electron automaticamente. Se não abrir, execute:

```bash
npx electron .
```

### Opção 2: Build para Produção

Se você quer criar um executável:

#### 1. Build Backend

```bash
cd nodejs
npm run build
npm start
```

#### 2. Build Electron

```bash
cd electron
npm run build
npm run electron-dist
```

O executável estará em `electron/dist/` ou `electron/out/`

## 🔑 Criando uma Conta

1. Abra o app Electron
2. Clique em **"Create Account"** (ou similar)
3. Preencha:
   - **Username**: Nome único (ex: seu_nome_2024)
   - **Password**: Senha segura
4. Clique em **Register**

## 💬 Enviando Mensagens

1. **Login**: Use suas credenciais criadas
2. **Selecione ou crie uma conversa**:
   - Na barra lateral, clique em uma conversa existente
   - Ou procure um colega para iniciar uma conversa
3. **Digite uma mensagem** na área de entrada
4. Pressione **Enter** ou clique no botão **Send**

## 📱 Menu de Opções (3 pontos)

No header do chat, clique no botão com **3 pontos (⋯)** para:
- 🔔 Mute notifications
- 📦 Archive conversation
- 🗑️ Clear chat
- ❌ Delete conversation

## 🌐 Conectando com Colegas na Rede da Faculdade

Para usar o chat na rede da faculdade onde múltiplos computadores precisam se conectar ao mesmo servidor:

### Passo 1: Configurar o Servidor (Computador que roda o backend)

1. **Descubra o IP da sua máquina na rede:**
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1

   # Ou use:
   hostname -I
   ```

2. **Anote o IP local** (geralmente começa com 192.168.x.x ou 10.x.x.x)

3. **Inicie o backend normalmente:**
   ```bash
   cd nodejs
   npm run dev
   ```

### Passo 2: Configurar os Clientes (Computadores dos colegas)

Para cada computador que vai usar o chat, configure as variáveis de ambiente:

#### Linux/Mac:
```bash
# No terminal, antes de iniciar o Electron:
export REDES_SERVER_HOST="192.168.1.100"  # IP do servidor
export REDES_SERVER_PORT="5000"
cd electron
npm run dev
```

#### Windows (PowerShell):
```powershell
# No PowerShell, antes de iniciar o Electron:
$env:REDES_SERVER_HOST = "192.168.1.100"  # IP do servidor
$env:REDES_SERVER_PORT = "5000"
cd electron
npm run dev
```

#### Windows (CMD):
```cmd
# No CMD, antes de iniciar o Electron:
set REDES_SERVER_HOST=192.168.1.100
set REDES_SERVER_PORT=5000
cd electron
npm run dev
```

### Passo 3: Verificar Conexão

1. Abra o aplicativo Electron
2. Tente fazer login
3. Se der erro de conexão, verifique:
   - O IP do servidor está correto
   - O backend está rodando no servidor
   - Não há firewall bloqueando a porta 5000
   - Todos estão na mesma rede

### 🔥 Dica Rápida para Faculdade

Crie um arquivo `.env` na pasta `electron/` com:
```
REDES_SERVER_HOST=192.168.1.100
REDES_SERVER_PORT=5000
```

E use um script para iniciar:
```bash
# Linux/Mac
source .env && npm run dev

# Windows
# Crie um arquivo .bat com:
# set REDES_SERVER_HOST=192.168.1.100
# set REDES_SERVER_PORT=5000
# npm run dev
```

## 🐳 Usando Docker (Recomendado para Deploy)

Se você quer facilitar a distribuição:

```bash
# Iniciar backend com Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar
docker-compose down
```

Ver mais detalhes em [DOCKER.md](./DOCKER.md)

## 🐛 Solução de Problemas

### "Connection refused"

**Problema**: O frontend não consegue conectar ao backend

**Solução**:
1. Verifique se o backend está rodando: `npm run dev` na pasta `nodejs`
2. Verifique se a porta 5000 está disponível
3. Se usar IP remoto, certifique-se de que a máquina está acessível

### "Port 5000 already in use"

**Problema**: Outra aplicação está usando a porta 5000

**Solução**:
```bash
# Linux/Mac - Encontre o processo
lsof -i :5000

# Windows - Use o Task Manager para matar o processo
# Ou mude a porta no arquivo .env
```

### "npm: command not found"

**Problema**: Node.js não está instalado

**Solução**: [Baixe e instale Node.js](https://nodejs.org/)

### App congela ou não responde

**Solução**:
1. Feche o app
2. Limpe o cache:
   ```bash
   cd electron
   rm -rf node_modules dist
   npm install
   npm run dev
   ```

## 📊 Estrutura do Projeto

```
redes/
├── electron/          # Frontend (Electron + React + TypeScript)
│   ├── src/
│   │   ├── renderer/  # Componentes React
│   │   └── main/      # Processo principal Electron
│   └── package.json
├── nodejs/            # Backend (Node.js + TypeScript + Socket.io)
│   ├── src/
│   │   ├── server.ts  # Servidor principal
│   │   ├── database/  # Operações do banco de dados
│   │   └── handlers/  # Handlers de socket
│   ├── Dockerfile
│   └── package.json
├── design/            # Design system (shadcn/ui components)
└── docker-compose.yml # Configuração Docker
```

## 🔐 Segurança

- ✅ Senhas criptografadas com bcryptjs
- ✅ Mensagens em tempo real via WebSocket
- ✅ Banco de dados SQLite persistente
- ⚠️ Para produção, considere adicionar:
  - HTTPS/TLS
  - Autenticação por JWT
  - Rate limiting

## 📞 Suporte e Feedback

Se encontrar problemas ou tiver sugestões:
1. Crie uma **issue** no repositório
2. Descreva o problema em detalhes
3. Inclua prints ou logs de erro

## 🎓 Próximos Passos

Ideias para melhorias:
- [ ] Grupos de chat
- [ ] Compartilhamento de arquivos
- [ ] Video chamadas
- [ ] Notificações desktop
- [ ] Temas escuro/claro
- [ ] Busca de mensagens

---

**Aproveite o RedES Chat! 🎉**
