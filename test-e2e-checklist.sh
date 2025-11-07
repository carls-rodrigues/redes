#!/bin/bash

# RedES Chat - End-to-End Testing Checklist
# This script verifies the complete application workflow

echo "🧪 RedES Chat - End-to-End Testing Checklist"
echo "==========================================="
echo ""

# Check 1: Services Running
echo "1️⃣ Checking Services..."
SOCKET_RUNNING=$(ps aux | grep -E "ts-node.*server|node.*dist/server" | grep -v grep | wc -l)
ELECTRON_RUNNING=$(ps aux | grep "electron \." | grep -v grep | wc -l)
VITE_RUNNING=$(ps aux | grep vite | grep -v grep | wc -l)

if [ $SOCKET_RUNNING -gt 0 ]; then
  echo "   ✅ Socket server running"
else
  echo "   ❌ Socket server NOT running"
fi

if [ $ELECTRON_RUNNING -gt 0 ]; then
  echo "   ✅ Electron app running"
else
  echo "   ❌ Electron app NOT running"
fi

if [ $VITE_RUNNING -gt 0 ]; then
  echo "   ✅ Vite dev server running"
else
  echo "   ❌ Vite dev server NOT running"
fi

echo ""

# Check 2: Database Files
echo "2️⃣ Checking Database Files..."
ELECTRON_DB="/home/cerf/.config/redes-chat/redes_chat.db"
NODEJS_DB="/home/cerf/development/college/redes/nodejs/redes_chat.db"

if [ -f "$ELECTRON_DB" ]; then
  echo "   ✅ Electron database: $ELECTRON_DB"
else
  echo "   ❌ Electron database NOT found"
fi

if [ -f "$NODEJS_DB" ]; then
  echo "   ✅ Node.js database: $NODEJS_DB"
else
  echo "   ❌ Node.js database NOT found"
fi

echo ""

# Check 3: Preload Script
echo "3️⃣ Checking Preload Script..."
PRELOAD="/home/cerf/development/college/redes/electron/dist-electron/preload.js"

if [ -f "$PRELOAD" ]; then
  HAS_REGISTER=$(grep -c "register" "$PRELOAD")
  if [ $HAS_REGISTER -gt 0 ]; then
    echo "   ✅ Preload script exists with register function"
  else
    echo "   ❌ Preload script missing register function"
  fi
else
  echo "   ❌ Preload script NOT found"
fi

echo ""

# Check 4: Socket Connection
echo "4️⃣ Checking Socket Server Port..."
(echo "" | nc -w 1 localhost 5000 2>/dev/null) && echo "   ✅ Socket server responding on port 5000" || echo "   ❌ Socket server NOT responding on port 5000"

echo ""

# Check 5: Vite Dev Server
echo "5️⃣ Checking Vite Dev Server..."
(curl -s http://localhost:5173 > /dev/null 2>&1) && echo "   ✅ Vite dev server responding on port 5173" || echo "   ❌ Vite dev server NOT responding"

echo ""

echo "📋 Manual Testing Steps:"
echo "========================"
echo ""
echo "1. Register a new user:"
echo "   - Open Electron app"
echo "   - Click 'Sign up'"
echo "   - Enter username and password"
echo "   - Click 'Sign up' button"
echo "   ✓ Should see chat interface loaded"
echo ""
echo "2. Verify socket connection:"
echo "   - Check Electron console (DevTools)"
echo "   - Should see socket connection messages"
echo "   ✓ No ECONNREFUSED errors"
echo ""
echo "3. Test loading chats:"
echo "   - Should see conversation list (or 'No conversations yet')"
echo "   - If you have existing chats, they should load"
echo ""
echo "4. Send a test message (if chat exists):"
echo "   - Select a conversation"
echo "   - Type a message in the input field"
echo "   - Press Enter or click Send"
echo "   ✓ Message should appear in chat"
echo ""
echo "5. Real-time delivery:"
echo "   - Open app in another window (or another machine)"
echo "   - Send message from first window"
echo "   ✓ Second window should receive message in real-time"
echo ""

echo "✅ Test checklist complete!"
