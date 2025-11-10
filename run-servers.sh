#!/bin/bash

# Script para executar ambos os servidores (Backend + Frontend)
# Redes Chat - Execução Simultânea
# Data: November 10, 2025

# Obter IP da máquina para rede do laboratório
IP_ADDRESS=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDRESS" ]; then
    IP_ADDRESS="0.0.0.0"
fi

echo "🚀 Iniciando servidores do Chat..."
echo "🌐 IP da máquina: $IP_ADDRESS"
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se uma porta está livre
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Porta $port já está em uso${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Porta $port está livre${NC}"
        return 0
    fi
}

# Verificar portas necessárias
echo -e "${BLUE}🔍 Verificando portas...${NC}"
check_port 5000 || exit 1
check_port 3000 || exit 1
echo ""

# Função para iniciar backend
start_backend() {
    echo -e "${YELLOW}🔧 Iniciando Backend (porta 5000)...${NC}"
    cd nodejs

    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
        npm install
    fi

    # Compilar TypeScript se necessário
    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}🔨 Compilando TypeScript...${NC}"
        npm run build
    fi

    # Iniciar servidor em background
    echo -e "${GREEN}▶️  Iniciando servidor backend...${NC}"
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!

    # Aguardar um pouco para o servidor iniciar
    sleep 3

    # Verificar se o processo ainda está rodando
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Backend iniciado com sucesso (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}❌ Falha ao iniciar backend${NC}"
        cat ../backend.log
        exit 1
    fi

    cd ..
}

# Função para iniciar frontend
start_frontend() {
    echo -e "${YELLOW}🎨 Iniciando Frontend (porta 3000)...${NC}"
    cd chat_frontend

    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
        npm install
    fi

    # Iniciar servidor em background
    echo -e "${GREEN}▶️  Iniciando servidor frontend...${NC}"
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!

    # Aguardar um pouco para o servidor iniciar
    sleep 5

    # Verificar se o processo ainda está rodando
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend iniciado com sucesso (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${RED}❌ Falha ao iniciar frontend${NC}"
        cat ../frontend.log
        exit 1
    fi

    cd ..
}

# Função para parar servidores
stop_servers() {
    echo ""
    echo -e "${YELLOW}🛑 Parando servidores...${NC}"

    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${BLUE}Parando backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
    fi

    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${BLUE}Parando frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
    fi

    echo -e "${GREEN}✅ Servidores parados${NC}"
    exit 0
}

# Trap para parar servidores quando o script for interrompido
trap stop_servers SIGINT SIGTERM

# Iniciar servidores
start_backend
start_frontend

echo ""
echo -e "${GREEN}🎉 Ambos os servidores estão rodando!${NC}"
echo "=================================="
echo -e "${BLUE}🌐 Acesse de outros computadores na rede:${NC}"
echo -e "${BLUE}📡 Backend (API/WebSocket): http://$IP_ADDRESS:5000${NC}"
echo -e "${BLUE}🌐 Frontend (Web App): http://$IP_ADDRESS:3000${NC}"
echo ""
echo -e "${YELLOW}💡 Pressione Ctrl+C para parar ambos os servidores${NC}"
echo ""

# Aguardar indefinidamente
wait