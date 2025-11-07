#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RedES Chat - Setup Automático${NC}\n"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "Baixe em: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} instalado${NC}\n"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não encontrado!${NC}"
    echo "Baixe em: https://git-scm.com/"
    exit 1
fi

echo -e "${GREEN}✓ Git instalado${NC}\n"

# Setup Backend
echo -e "${BLUE}📦 Configurando Backend (Node.js)...${NC}"
cd nodejs
npm install
npm run build
echo -e "${GREEN}✓ Backend pronto!${NC}\n"

# Setup Frontend
echo -e "${BLUE}🎨 Configurando Frontend (Electron)...${NC}"
cd ../electron
npm install
echo -e "${GREEN}✓ Frontend pronto!${NC}\n"

echo -e "${GREEN}✅ Setup completo!${NC}\n"

echo -e "${BLUE}Próximos passos:${NC}"
echo ""
echo "1. Em um terminal, inicie o Backend:"
echo -e "   ${GREEN}cd nodejs && npm run dev${NC}"
echo ""
echo "2. Em outro terminal, inicie o Frontend:"
echo -e "   ${GREEN}cd electron && npm run dev${NC}"
echo ""
echo "Pronto! O app abrirá automaticamente."
echo ""
echo "Para mais informações, veja: SETUP.md"
