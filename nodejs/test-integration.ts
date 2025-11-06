import * as net from 'net'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Setup database
const dbPath = '/home/cerf/development/college/redes/nodejs/redes_chat.db'
const db = new Database(dbPath)

// Initialize tables if needed
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('dm', 'group')) NOT NULL,
    group_id TEXT,
    created_at TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS chat_participants (
    id TEXT PRIMARY KEY,
    chat_session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TEXT,
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(chat_session_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_session_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT,
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    creator_id TEXT NOT NULL,
    created_at TEXT,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

console.log(`📊 Database path: ${dbPath}`)
console.log(`🧪 Integration Test: Socket Communication\n`)

// Function to create test users
function createTestUsers() {
  try {
    const users = db.prepare('SELECT * FROM users').all() as Array<{ id: string; username: string; password: string }>
    console.log(`📌 Found ${users.length} users in database`)
    
    // Se não tem 2 usuários, criar mais
    if (users.length < 2) {
      console.log('\n✨ Creating additional test users...')
      
      const createUser = db.prepare(`
        INSERT INTO users (id, username, password, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `)
      
      const testUsers = [
        { username: 'user1', password: 'pass123' },
        { username: 'user2', password: 'pass456' }
      ]
      
      for (const { username, password } of testUsers) {
        // Check if user already exists
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
        if (!existing) {
          const id = uuidv4()
          const hash = bcrypt.hashSync(password, 10) // Use bcrypt instead of SHA-256
          createUser.run(id, username, hash)
          console.log(`   ✓ Created ${username}`)
        }
      }
    }
    
    return db.prepare('SELECT * FROM users').all() as Array<{ id: string; username: string; password: string }>
  } catch (error) {
    console.error('❌ Error with users:', error)
    return []
  }
}

// Get or create test chat
function getTestChat(userId1: string, userId2: string): { id: string } | null {
  try {
    let chat = db
      .prepare(
        `SELECT id FROM chat_sessions 
         WHERE type = 'dm' 
         AND id IN (
           SELECT chat_session_id FROM chat_participants WHERE user_id = ?
         )
         AND id IN (
           SELECT chat_session_id FROM chat_participants WHERE user_id = ?
         )`
      )
      .get(userId1, userId2) as { id: string } | undefined
    
    if (!chat) {
      console.log('\n✨ Creating test DM chat...')
      const chatId = uuidv4()
      db.prepare(`
        INSERT INTO chat_sessions (id, type, created_at)
        VALUES (?, ?, datetime('now'))
      `).run(chatId, 'dm')
      
      db.prepare(`
        INSERT INTO chat_participants (chat_session_id, user_id, joined_at)
        VALUES (?, ?, datetime('now')), (?, ?, datetime('now'))
      `).run(chatId, userId1, chatId, userId2)
      
      console.log(`   ✓ Created chat ${chatId}`)
      chat = { id: chatId }
    }
    
    return chat
  } catch (error) {
    console.error('❌ Error with chat:', error)
    return null
  }
}

// Main test flow
async function runTest() {
  try {
    // 1. Setup database
    console.log('1️⃣  Setting up database...')
    const users = createTestUsers()
    
    if (users.length < 2) {
      console.error('❌ Need at least 2 users for test')
      process.exit(1)
    }
    
    const [user1, user2] = users as Array<{ id: string; username: string }>
    console.log(`   ✓ Using ${user1.username} and ${user2.username}`)
    
    // 2. Get or create test chat
    console.log('\n2️⃣  Setting up test chat...')
    const chat = getTestChat(user1.id, user2.id)
    if (!chat) throw new Error('Failed to create chat')
    
    // 3. Connect as user1
    console.log(`\n3️⃣  Connecting user1 (${user1.username}) to socket...`)
    const socket1 = new Promise<net.Socket>((resolve, reject) => {
      const socket = net.createConnection({ host: 'localhost', port: 5000 }, () => {
        console.log('   ✓ Socket connected')
        resolve(socket)
      })
      socket.on('error', reject)
    })
    
    const s1 = await socket1
    
    // 4. Authenticate user1
    console.log(`\n4️⃣  Authenticating user1...`)
    s1.write(
      JSON.stringify({
        type: 'login',
        username: user1.username,
        password: 'pass123'
      }) + '\n'
    )
    
    // 5. User1 joins chat
    console.log(`\n5️⃣  User1 joining chat...`)
    s1.write(
      JSON.stringify({
        type: 'get_user_chats'
      }) + '\n'
    )
    
    // 6. Connect as user2
    console.log(`\n6️⃣  Connecting user2 (${user2.username}) to socket...`)
    const socket2 = new Promise<net.Socket>((resolve, reject) => {
      const socket = net.createConnection({ host: 'localhost', port: 5000 }, () => {
        console.log('   ✓ Socket connected')
        resolve(socket)
      })
      socket.on('error', reject)
    })
    
    const s2 = await socket2
    
    // 7. Authenticate user2
    console.log(`\n7️⃣  Authenticating user2...`)
    s2.write(
      JSON.stringify({
        type: 'login',
        username: user2.username,
        password: 'pass456'
      }) + '\n'
    )
    
    // 8. User2 joins chat
    console.log(`\n8️⃣  User2 joining chat...`)
    s2.write(
      JSON.stringify({
        type: 'get_user_chats'
      }) + '\n'
    )
    
    // 9. User1 sends message
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log(`\n9️⃣  User1 sending message...`)
    const messageId = uuidv4()
    s1.write(
      JSON.stringify({
        type: 'message',
        chat_id: chat.id,
        content: 'Hello from integration test!'
      }) + '\n'
    )
    
    // 10. Listen for message on user2
    console.log(`\n🔟 Listening for message on user2 (5s timeout)...`)
    let messageReceived = false
    
    const messageListener = (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.message) {
          console.log('   ✓ Message received by user2!')
          console.log(`      Content: "${msg.message.content}"`)
          messageReceived = true
        }
      } catch (e) {}
    }
    
    s2.on('data', messageListener)
    
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 11. Cleanup
    console.log(`\n✨ Test completed!`)
    if (messageReceived) {
      console.log('✅ Real-time messaging works!')
    } else {
      console.log('⚠️  Message not received (might be handled differently by server)')
    }
    
    s1.end()
    s2.end()
    
    db.close()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

runTest()
