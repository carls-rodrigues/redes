#!/bin/bash

# Redes Chat Backend - College Quick Deploy Script
# Version 1.1.1 - November 9, 2025
# Enhanced with real-time socket logging and configurable networking
#
# Changes in v1.1.1:
# - Configurable PORT and HOST environment variables
# - Network binding to all interfaces (0.0.0.0) by default
# - Enhanced logging for socket interactions
# - Real-time message flow tracking
# - Professional logging format for professor demonstrations

# Default configuration (can be overridden with environment variables)
PORT=${PORT:-5000}
HOST=${HOST:-0.0.0.0}

echo "🔧 Configuration:"
echo "   Port: $PORT"
echo "   Host: $HOST"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not available. Please install docker-compose.${NC}"
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker environment ready${NC}"
echo ""

# Create deployment directory
DEPLOY_DIR="redes-chat-backend"
if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}⚠️  Deployment directory '$DEPLOY_DIR' already exists.${NC}"
    read -p "Remove and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$DEPLOY_DIR"
    else
        echo "Exiting..."
        exit 1
    fi
fi

mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo -e "${GREEN}📁 Created deployment directory: $DEPLOY_DIR${NC}"

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  redes-chat-backend:
    image: cerfdotdev/redes_backend:latest
    ports:
      - "$PORT:$PORT"
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/redes_chat.db
      - SOCKET_PORT=$PORT
      - PORT=$PORT
      - HOST=$HOST
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('net').connect(process.env.PORT || 5000, 'localhost', function() { process.exit(0); }).on('error', function() { process.exit(1); })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  data:
    driver: local
EOF

# Create data directory
mkdir -p data

echo -e "${GREEN}📄 Created deployment files${NC}"
echo ""

# Pull the image
echo "📥 Pulling latest Docker image (v1.1.0 with enhanced logging)..."
if docker pull cerfdotdev/redes_backend:latest; then
    echo -e "${GREEN}✅ Latest image downloaded successfully${NC}"
    echo -e "${GREEN}   📋 Includes: Enhanced real-time socket logging${NC}"
else
    echo -e "${RED}❌ Failed to download image. Check your internet connection.${NC}"
    exit 1
fi

echo ""
echo "🚀 Starting Redes Chat Backend..."

# Start the service
if docker-compose up -d; then
    echo -e "${GREEN}✅ Service started successfully!${NC}"
    echo ""
    echo "🌐 Access points:"
    echo "   WebSocket: ws://$HOST:$PORT/ws"
    echo "   Raw TCP: $HOST:$PORT"
    echo "   Health check: http://$HOST:$PORT"
    echo ""
    echo "📊 Check status:"
    echo "   docker-compose ps"
    echo "   docker-compose logs -f"
    echo ""
    echo "🔍 Enhanced Logging Features:"
    echo "   • Real-time socket connection tracking"
    echo "   • Message flow visualization"
    echo "   • Broadcasting confirmation logs"
    echo "   • Authentication success indicators"
    echo ""
    echo -e "${GREEN}🎓 Ready for college demonstration!${NC}"
    echo ""
    echo "💡 Pro tip: Run 'docker-compose logs -f' to see live socket interactions!"
else
    echo -e "${RED}❌ Failed to start service. Check the logs:${NC}"
    echo "   docker-compose logs"
    exit 1
fi