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

    // Adicionar coluna updated_at à tabela chat_sessions existente se não existir
    try {
      // Primeiro verificar se a coluna existe
      const tableInfo = this.db.prepare("PRAGMA table_info(chat_sessions)").all() as any[];
      const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
      
      if (!hasUpdatedAt) {
        this.db.exec(`ALTER TABLE chat_sessions ADD COLUMN updated_at TEXT`);
        // Definir updated_at como created_at para linhas existentes
        this.db.exec(`UPDATE chat_sessions SET updated_at = created_at WHERE updated_at IS NULL`);
      }
    } catch (error) {
      // Coluna pode já existir, ignorar erro
    }

    // Adicionar colunas read_at e read_by à tabela messages existente se não existirem
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(messages)").all() as any[];
      const hasReadAt = tableInfo.some(col => col.name === 'read_at');
      const hasReadBy = tableInfo.some(col => col.name === 'read_by');
      
      if (!hasReadAt) {
        this.db.exec(`ALTER TABLE messages ADD COLUMN read_at TEXT`);
      }
      if (!hasReadBy) {
        this.db.exec(`ALTER TABLE messages ADD COLUMN read_by TEXT`);
      }

      // Verificar se existe foreign key no read_by e removê-la se necessário
      const foreignKeys = this.db.prepare("PRAGMA foreign_key_list(messages)").all() as any[];
      const hasReadByForeignKey = foreignKeys.some((fk: any) => fk.from === 'read_by');
      
      if (hasReadByForeignKey) {
        console.log('🔄 Removendo foreign key inválida do campo read_by...');
        // SQLite não permite DROP CONSTRAINT, então recriamos a tabela
        this.db.transaction(() => {
          // Criar tabela temporária com estrutura correta
          this.db.exec(`
            CREATE TABLE messages_temp (
              id TEXT PRIMARY KEY,
              chat_session_id TEXT NOT NULL,
              sender_id TEXT NOT NULL,
              content TEXT NOT NULL,
              timestamp TEXT,
              read_at TEXT,
              read_by TEXT,
              FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id),
              FOREIGN KEY (sender_id) REFERENCES users(id)
            )
          `);
          
          // Copiar dados
          this.db.exec(`
            INSERT INTO messages_temp (id, chat_session_id, sender_id, content, timestamp, read_at, read_by)
            SELECT id, chat_session_id, sender_id, content, timestamp, read_at, read_by FROM messages
          `);
          
          // Substituir tabela original
          this.db.exec(`DROP TABLE messages`);
          this.db.exec(`ALTER TABLE messages_temp RENAME TO messages`);
          
          console.log('✓ Foreign key do read_by removida com sucesso');
        })();
      }
    } catch (error) {
      // Colunas podem já existir, ignorar erro
      console.log('⚠️  Erro na migração (pode ser normal):', error instanceof Error ? error.message : String(error));
    }

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
