import * as net from 'net'
import { v4 as uuidv4 } from 'uuid'

const TEST_USER_ID = uuidv4()
const PORT = 5000
const HOST = 'localhost'

console.log(`🧪 Socket Test Client`)
console.log(`   User ID: ${TEST_USER_ID}`)
console.log(`   Server: ${HOST}:${PORT}\n`)

const socket = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log('✓ Connected to socket server\n')

  // 1. Enviar autenticação
  console.log('1️⃣  Sending auth message...')
  socket.write(
    JSON.stringify({
      type: 'auth',
      userId: TEST_USER_ID
    }) + '\n'
  )

  // 2. Aguardar um pouco e enviar uma mensagem
  setTimeout(() => {
    console.log('\n2️⃣  Sending test message...')
    socket.write(
      JSON.stringify({
        type: 'message:send',
        userId: TEST_USER_ID,
        chatId: 'test-chat-123',
        content: 'Hello from test client!',
        timestamp: new Date().toISOString()
      }) + '\n'
    )
  }, 1000)

  // 3. Testar join chat
  setTimeout(() => {
    console.log('\n3️⃣  Joining chat room...')
    socket.write(
      JSON.stringify({
        type: 'chat:join',
        userId: TEST_USER_ID,
        chatId: 'test-chat-123'
      }) + '\n'
    )
  }, 2000)

  // 4. Desconectar após 5 segundos
  setTimeout(() => {
    console.log('\n4️⃣  Closing connection...')
    socket.end()
  }, 5000)
})

socket.on('data', (data) => {
  try {
    const message = JSON.parse(data.toString())
    console.log('\n📨 Received from server:')
    console.log('   ', JSON.stringify(message, null, 2))
  } catch (error) {
    console.log('\n📨 Raw data:', data.toString())
  }
})

socket.on('error', (error) => {
  console.error('\n❌ Socket error:', error.message)
})

socket.on('end', () => {
  console.log('\n✓ Connection closed')
  process.exit(0)
})

socket.on('close', () => {
  console.log('✓ Socket closed')
})
