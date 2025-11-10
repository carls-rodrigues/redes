# 🚀 Como Executar o Chat - Sem Docker

Para executar ambos os servidores (Backend + Frontend) simultaneamente, use um dos comandos abaixo:

## Opção 1: Script Completo (Recomendado)

```bash
./run-servers.sh
```

Este script:

- ✅ Verifica se as portas estão livres
- ✅ Instala dependências automaticamente (se necessário)
- ✅ Compila o TypeScript
- ✅ Inicia ambos os servidores em background
- ✅ Mostra logs detalhados
- ✅ Para ambos os servidores com Ctrl+C

## Opção 2: Script Simples

```bash
./start-chat.sh
```

Este script:

- ✅ Inicia ambos os servidores rapidamente
- ✅ Para ambos os servidores com Ctrl+C

## URLs de Acesso

Os servidores aceitarão conexões de qualquer computador na rede:

- 🌐 **Frontend (Web App)**: `http://[IP-DA-MÁQUINA]:3000`
- 📡 **Backend (API/WebSocket)**: `http://[IP-DA-MÁQUINA]:5000`

**O script mostrará automaticamente o IP da sua máquina!**

## Como Usar na Apresentação

1. Abra um terminal
2. Execute: `./run-servers.sh` ou `./start-chat.sh`
3. **Aguarde o IP da máquina aparecer na tela**
4. Anuncie o IP para os colegas: "Acessem http://[IP]:3000"
5. Abra o navegador em `http://[IP-DA-MÁQUINA]:3000`
6. Pressione Ctrl+C no terminal para parar os servidores

## 🔗 Acesso pela Rede

Os servidores estão configurados para aceitar conexões de qualquer computador na rede do laboratório:

- ✅ **Backend**: Aceita conexões WebSocket/TCP de qualquer IP
- ✅ **Frontend**: Aceita conexões HTTP de qualquer IP
- ✅ **Scripts**: Mostram automaticamente o IP da máquina

**Exemplo**: Se o IP da sua máquina for `10.1.1.100`, acesse:

- Frontend: `http://[IP-DA-MÁQUINA]:3000`
- Backend: `http://[IP-DA-MÁQUINA]:5000`

## Requisitos

### 🔧 Node.js e npm
- **Node.js** versão 18 ou superior instalado
- **npm** (geralmente vem com Node.js)

**Para verificar se estão instalados:**
```bash
node --version
npm --version
```

**Para instalar (Ubuntu/Debian):**
```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Para instalar (Windows/macOS):**
- Baixe do site oficial: https://nodejs.org/

### 🌐 Sistema
- Portas 3000 e 5000 livres (não em uso por outros programas)
- Conexão de rede para acesso remoto (se necessário)

## 🔧 Troubleshooting

### "node: command not found"

- Node.js não está instalado ou não está no PATH
- Execute: `which node` para verificar
- Reinstale Node.js seguindo as instruções acima

### "Porta já em uso"

- Algum outro programa está usando a porta 3000 ou 5000
- Para verificar: `lsof -i :3000` ou `ss -tlnp | grep :3000`
- Para liberar: `sudo kill -9 PID_DO_PROCESSO`

### "Permissões negadas"

- Execute os scripts com permissões: `chmod +x *.sh`
- Ou execute com: `bash run-servers.sh`

### "npm install falha"

- Verifique conexão com internet
- Execute: `npm cache clean --force`
- Tente novamente: `npm install`

## Logs

Os logs são salvos em:

- `backend.log` - Logs do servidor backend
- `frontend.log` - Logs do servidor frontend
