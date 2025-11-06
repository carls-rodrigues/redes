import SQLiteDatabase from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../redes_chat.db');

class DatabaseManager {
  private db: SQLiteDatabase.Database;

  constructor() {
    this.db = new SQLiteDatabase(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initDb();
  }

  private initDb() {
    this.db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_session_id);
    `);

    console.log('✓ Database initialized');
  }

  prepare(sql: string): SQLiteDatabase.Statement {
    return this.db.prepare(sql);
  }

  exec(sql: string): SQLiteDatabase.Database {
    return this.db.exec(sql);
  }

  transaction<T>(fn: () => T): T {
    const trans = this.db.transaction(fn);
    return trans();
  }

  close() {
    this.db.close();
  }
}

export default new DatabaseManager();
