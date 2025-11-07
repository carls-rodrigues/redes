# 🎯 QuickStart para Colegas

## TL;DR - Comece em 2 minutos

### Windows
```bash
setup.bat
```

### Linux / macOS
```bash
chmod +x setup.sh
./setup.sh
```

## Depois que rodar o setup:

### Terminal 1
```bash
cd nodejs
npm run dev
```

### Terminal 2
```bash
cd electron
npm run dev
```

**Pronto! O app abre automaticamente** 🎉

## Para conversar com seus colegas

**Se estão na mesma rede:**

1. Abra um CMD/Terminal na máquina do servidor
2. Execute: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)
3. Anote o IP (tipo 192.168.X.X)
4. Seus colegas editam `electron/src/renderer/App.tsx`
5. Mudam `localhost:5000` para `SEU_IP:5000`
6. Rodam `npm run dev` em electron/

## Problemas?

- ❌ **Port 5000 in use**: Mude a porta em `nodejs/.env`
- ❌ **npm not found**: Instale Node.js em https://nodejs.org/
- ❌ **Can't connect**: Certifique-se que backend está rodando

## Próximo passo

Leia [SETUP.md](./SETUP.md) para guia completo!
