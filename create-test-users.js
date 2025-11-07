#!/usr/bin/env node
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = new Database(path.join(__dirname, 'nodejs/redes_chat.db'));

// Create test users
const users = [
  { username: 'testuser1', password: 'password123' },
  { username: 'testuser2', password: 'password123' }
];

for (const user of users) {
  try {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, user.username, hashedPassword, createdAt);
    console.log(`✓ Created user: ${user.username}`);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      console.log(`ℹ User already exists: ${user.username}`);
    } else {
      console.error(`✗ Error creating user ${user.username}:`, error.message);
    }
  }
}

db.close();
console.log('✓ Done');
