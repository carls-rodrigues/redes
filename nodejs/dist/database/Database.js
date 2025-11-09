"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../../redes_chat.db');
class DatabaseManager {
    constructor() {
        this.db = new better_sqlite3_1.default(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initDb();
    }
    initDb() {
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
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
        read_at TEXT,
        read_by TEXT,
        FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id),
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (read_by) REFERENCES users(id)
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
        // Add updated_at column to existing chat_sessions table if it doesn't exist
        try {
            // First check if column exists
            const tableInfo = this.db.prepare("PRAGMA table_info(chat_sessions)").all();
            const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
            if (!hasUpdatedAt) {
                this.db.exec(`ALTER TABLE chat_sessions ADD COLUMN updated_at TEXT`);
                // Set updated_at to created_at for existing rows
                this.db.exec(`UPDATE chat_sessions SET updated_at = created_at WHERE updated_at IS NULL`);
            }
        }
        catch (error) {
            // Column might already exist, ignore error
        }
        // Add read_at and read_by columns to existing messages table if they don't exist
        try {
            const tableInfo = this.db.prepare("PRAGMA table_info(messages)").all();
            const hasReadAt = tableInfo.some(col => col.name === 'read_at');
            const hasReadBy = tableInfo.some(col => col.name === 'read_by');
            if (!hasReadAt) {
                this.db.exec(`ALTER TABLE messages ADD COLUMN read_at TEXT`);
            }
            if (!hasReadBy) {
                this.db.exec(`ALTER TABLE messages ADD COLUMN read_by TEXT`);
            }
        }
        catch (error) {
            // Columns might already exist, ignore error
        }
        console.log('✓ Database initialized');
    }
    prepare(sql) {
        return this.db.prepare(sql);
    }
    exec(sql) {
        return this.db.exec(sql);
    }
    transaction(fn) {
        const trans = this.db.transaction(fn);
        return trans();
    }
    close() {
        this.db.close();
    }
}
exports.default = new DatabaseManager();
//# sourceMappingURL=Database.js.map