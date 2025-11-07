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

### Opção 1: Desenvolvimento Local (Recomendado para Testes)

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

## 🌐 Conectando com Colegas na Rede Local

Se ambos estão na **mesma rede local**:

### No Computador do Servidor

1. Execute o backend:
```bash
cd nodejs
npm run dev
```

2. Anote o **IP local** da máquina:
   - **Windows**: `ipconfig` (procure por "IPv4 Address")
   - **Linux/Mac**: `ifconfig` (procure por "inet addr")
   - Exemplo: `192.168.1.100`

### No Computador do Colega

1. Edite o arquivo `electron/src/renderer/App.tsx`
2. Procure pela linha que conecta ao servidor
3. Altere `localhost:5000` para `SERVIDOR_IP:5000` (ex: `192.168.1.100:5000`)
4. Salve e execute o Electron

Alternativa: Modifique a variável de ambiente antes de iniciar:

```bash
# Windows (PowerShell)
$env:VITE_SERVER_URL = "http://192.168.1.100:5000"
npm run dev

# Linux/Mac
export VITE_SERVER_URL="http://192.168.1.100:5000"
npm run dev
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
