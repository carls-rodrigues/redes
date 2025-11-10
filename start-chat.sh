#!/bin/bash

# Script simples para executar ambos os servidores
# Redes Chat - Comando único

# Obter IP da máquina para rede do laboratório
IP_ADDRESS=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDRESS" ]; then
    IP_ADDRESS="0.0.0.0"
fi

echo "🚀 Iniciando Chat Servers..."
echo "🌐 IP da máquina: $IP_ADDRESS"
echo "Backend: http://$IP_ADDRESS:5000"
echo "Frontend: http://$IP_ADDRESS:3000"
echo ""

# Obter diretório base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Definir variáveis de ambiente para aceitar conexões de qualquer host
export HOST=0.0.0.0
export PORT=5000

# Iniciar backend em background
echo "🔧 Starting Backend..."
cd "$BASE_DIR/nodejs" && npm run dev > "$BASE_DIR/backend.log" 2>&1 &

# Aguardar backend iniciar
sleep 3

# Iniciar frontend em background
echo "🎨 Starting Frontend..."
cd "$BASE_DIR/chat_frontend" && HOST=0.0.0.0 npm run dev > "$BASE_DIR/frontend.log" 2>&1 &

# Aguardar frontend iniciar
sleep 5

echo ""
echo "✅ Servers started!"
echo "🌐 Acesse de outros computadores na rede:"
echo "   Frontend: http://$IP_ADDRESS:3000"
echo "   Backend:  http://$IP_ADDRESS:5000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Manter script rodando
trap 'echo ""; echo "🛑 Stopping servers..."; pkill -f "npm run dev"; exit 0' INT
wait