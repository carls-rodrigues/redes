import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime
import uuid
import sqlite3
import hashlib
from models.models import ChatSession, User, Group, Session


class Database:
    def __init__(self, conn=sqlite3.Connection):
      self.connection = conn
      
      self.init_db()

    def init_db(self):
        c = self.connection.cursor()
        c.execute('''PRAGMA foreign_keys = ON;''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                connection_id TEXT,
                last_seen TEXT
            );''')

        c.execute('''
                CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                created_at TEXT,
                creator_id TEXT NOT NULL,
                FOREIGN KEY (creator_id) REFERENCES users(id)
            );
            ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            type TEXT CHECK (type IN ('dm', 'group')) NOT NULL,
            started_at TEXT,
            group_id TEXT, -- optional: only used for group chats
            FOREIGN KEY (group_id) REFERENCES groups(id)
            );
            ''')

        c.execute('''
                CREATE TABLE IF NOT EXISTS chat_participants (
                chat_session_id TEXT,
                user_id TEXT,
                PRIMARY KEY (chat_session_id, user_id),
                FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
                );
            ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                chat_session_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                group_id TEXT,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id),
                FOREIGN KEY (group_id) REFERENCES groups(id)
            );
            ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS user_groups (
                user_id TEXT,
                group_id TEXT,
                joined_at TEXT,
                role TEXT DEFAULT 'member',
                PRIMARY KEY (user_id, group_id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (group_id) REFERENCES groups(id),
                CHECK (role IN ('member', 'admin', 'owner'))
            );
            ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS auth (
                user_id TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                is_expired BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            ''')
        self.connection.commit()

    def reset_database(self):
        global auth, messages, grupos, user_groups, users
        auth = dict()
        messages = dict()
        grupos = dict() 
        user_groups = dict()
        users = dict()
    
    def close_connection(self, conn):
        conn.close()

    def register_user(self, user, password):
        # save to DB
        c = self.connection.cursor()
        c.execute('INSERT INTO users (id, username, connection_id, last_seen) VALUES (?, ?, ?, ?)',
                  (user.id, user.username, user.connection_id, user.last_seen))
        c.execute('INSERT INTO auth (user_id, password_hash) VALUES (?, ?)',
                  (user.id, password))
        self.connection.commit()

        return user
        
    def get_message(self, user_id=None, group_id=None):
        if not user_id:
            raise ValueError("At least user_id must be provided.")

        if not group_id:
            relevant_messages = [
                msg for msg in self.messages.values()
                if msg["recipient_id"] == user_id or msg["sender_id"] == user_id
            ]
            return relevant_messages
        
        if user_id and group_id:
            # check if group exists
            if group_id not in self.grupos:
                raise ValueError("Group does not exist.")

            relevant_messages = [
                msg for msg in messages.values()
                if msg["group_id"] == group_id
            ]
            return relevant_messages

    def create_group(self, name, creator_id):
        if creator_id not in self.users:
            raise ValueError("Creator user does not exist.")        

        group = {
            "id": str(uuid.uuid4()),
            "name": name,
            "created_at": datetime.now(),
            "creator_id": creator_id,
        }
        self.grupos[group["id"]] = group

        self.user_groups[(creator_id, group["id"])] = {
            "user_id": creator_id,
            "group_id": group["id"],
            "joined_at": datetime.now(),
            "role": "owner",
        }
        return group

    def get_group(self, group_id):
        return self.grupos.get(group_id)

    def add_user_to_group(self, admin_id, user_id, group_id, role="member"):
        if admin_id not in self.users:
            raise ValueError("Admin user does not exist.")
        if user_id not in self.users:
            raise ValueError("User does not exist.")
        if group_id not in self.grupos:
            raise ValueError("Group does not exist.")
        if role not in ("owner","admin", "member"):
            raise ValueError("Invalid role specified.")
        
        admin = self.get_user_groups(admin_id, group_id)
        if not admin or admin.get("role") != "admin" and admin.get("role") != "owner":
            raise ValueError("Only admins can add users to groups.")
        
        user = self.get_user_groups(user_id, group_id)
        if user:
            raise ValueError("User is already in the group.")
        
        key = (user_id, group_id)
        self.user_groups[key] = {
            "user_id": user_id,
            "group_id": group_id,
            "joined_at": datetime.now(),
            "role": role,
        }
    
    def remove_user_from_group(self, admin_id, user_id, group_id):
        if admin_id not in self.users:
            raise ValueError("Admin user does not exist.")
        if user_id not in self.users:
            raise ValueError("User does not exist.")
        if group_id not in self.grupos:
            raise ValueError("Group does not exist.")
        
        admin = self.get_user_groups(admin_id, group_id)
        if not admin or admin.get("role") != "admin" and admin.get("role") != "owner":
            raise ValueError("Only admins can remove users from groups.")
        if admin_id == user_id:
            raise ValueError("Delete the group instead of removing yourself.")
        if not self.get_user_groups(user_id, group_id):
            raise ValueError("User is not in the group.")
        if admin.get("role") == "admin":
            target = self.get_user_groups(user_id, group_id)
            if target.get("role") == "admin" or target.get("role") == "owner":
                raise ValueError("Admins cannot remove other admins or owners.")
        if admin.get("role") == "owner":
            target = self.get_user_groups(user_id, group_id)
            if target.get("role") == "owner":
                raise ValueError("Owner cannot remove themselves. Delete the group instead.")
        
        key = (user_id, group_id)
        if key in self.user_groups:
            del self.user_groups[key]

    def get_user_groups(self, user_id, group_id):
        key = (user_id, group_id)
        return self.user_groups.get(key)

    def login_user(self, username):
        c = self.connection.cursor()
        c.execute('SELECT user_id, password_hash FROM auth WHERE user_id = (SELECT id FROM users WHERE username = ?)', (username,))
        result = c.fetchone()
        return result

    def get_user_by_id(self, user_id):
        c = self.connection.cursor()
        c.execute('SELECT id, username, connection_id, last_seen FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            user = User(username=row[1], id=row[0], connection_id=row[2], last_seen=row[3])
            return user
        return None
  
    def get_user_by_username(self, username):
        c = self.connection.cursor()
        c.execute('SELECT id, username, connection_id, last_seen FROM users WHERE username = ?', (username,))
        row = c.fetchone()
        if row:
            user = User(username=row[1], id=row[0], connection_id=row[2], last_seen=row[3])
            return user
        return None
  
    def update_user(self, user_id, user):
        c = self.connection.cursor()
        c.execute('UPDATE users SET username = ?, connection_id = ?, last_seen = ? WHERE id = ?',
                  (user.username, user.connection_id, user.last_seen, user_id))
        self.connection.commit()

    def delete_user(self, user_id):
        c = self.connection.cursor()
        c.execute('DELETE FROM users WHERE id = ?', (user_id,))
        c.execute('DELETE FROM auth WHERE user_id = ?', (user_id,))
        self.connection.commit()

    def list_users(self):
        return list(self.users.values())

    def delete_group(self, group_id, admin_id):
        if group_id not in self.grupos:
            raise ValueError("Group not found.")
        group = self.grupos[group_id]
        if group['creator_id'] != admin_id:
            raise ValueError("Only creator can delete group.")
        # Remove all user_groups for this group
        keys_to_del = [k for k in self.user_groups if k[1] == group_id]
        for k in keys_to_del:
            del self.user_groups[k]
        del self.grupos[group_id]

    def list_groups(self):
        return list(self.grupos.values())

    def get_user_groups_list(self, user_id):
        return [self.grupos[gid] for uid, gid in self.user_groups if uid == user_id]

    def list_conversations(self, user_id):
        user = self.get_user(user_id)
        if not user:
            raise ValueError("User does not exist.")
        
        conversations = []
        for msg in self.messages.values():
            if msg["sender_id"] == user_id or msg["recipient_id"] == user_id:
                conversations.append(msg)
        return conversations

    def start_private_chat(self, user1_id, user2_id):
        # Check if already exists
        for g in self.grupos.values():
            members = [ug['user_id'] for ug in self.user_groups.values() if ug['group_id'] == g['id']]
            if set(members) == {user1_id, user2_id}:
                return g['id']
        # Create new group
        group = Group(f"Private-{user1_id}-{user2_id}")
        self.grupos[group.id] = {'id': group.id, 'name': group.name, 'created_at': group.created_at, 'creator_id': user1_id}
        self.add_user_to_group(user1_id, group.id, role="owner")
        self.add_user_to_group(user2_id, group.id, role="member")
        return group.id

    def save_message(self, message):
        c = self.connection.cursor()
        try:
          c.execute('''
                INSERT INTO messages (id, chat_session_id, sender_id, group_id, content, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                message.id,
                message.chat_id,
                message.sender_id,
                message.group_id,
                message.content,
                message.timestamp
            ))

          self.connection.commit()
        except sqlite3.IntegrityError as e:
          print(f"Error saving message: {e}")
          return None
        return message
    
    def list_chat_messages(self, user_id, chat_id):
        c = self.connection.cursor()
        c.execute('''
            SELECT 
                m.id,
                m.sender_id,
                u.username AS sender_username,
                m.content,
                m.timestamp,
                m.group_id
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            JOIN chat_participants cp ON cp.chat_session_id = m.chat_session_id
            WHERE m.chat_session_id = ?
            AND cp.user_id = ?
            ORDER BY m.timestamp ASC
        ''', (chat_id, user_id))

        rows = c.fetchall()
        messages = []
        for row in rows:
            messages.append({
                "id": row[0],
                "sender_id": row[1],
                "sender_username": row[2],
                "content": row[3],
                "timestamp": row[4],
                "group_id": row[5],
            })
        return messages

    def get_chat_session(self, chat_id):
        c = self.connection.cursor()

        # Fetch session info
        c.execute('SELECT id, type, started_at, group_id FROM chat_sessions WHERE id = ?', (chat_id,))
        row = c.fetchone()
        if not row:
            return None

        chat = ChatSession(
            id=row[0],
            type=row[1],
            started_at=row[2],
            group_id=row[3]
        )

        # Fetch participants
        c.execute('''
            SELECT u.id, u.username
            FROM chat_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.chat_session_id = ?
        ''', (chat_id,))
        participants = [{'id': r[0], 'username': r[1]} for r in c.fetchall()]

        chat.participants = participants
        return chat

    def create_chat_session(self, session_type, group_id=None):
        c = self.connection.cursor()
        chat_id = str(uuid.uuid4())
        started_at = datetime.now()
        c.execute('INSERT INTO chat_sessions (id, started_at, type, group_id) VALUES (?, ?, ?, ?)', (chat_id, started_at, session_type, group_id))
        self.connection.commit()
        chat = ChatSession(id=chat_id, started_at=started_at)
        return chat

    def get_or_create_dm_chat(self, sender_id, recipient_id):
        c = self.connection.cursor()
        chat = c.execute(
            '''
              SELECT cs.id FROM chat_sessions cs
              JOIN chat_participants p1 ON cs.id = p1.chat_session_id
              JOIN chat_participants p2 ON cs.id = p2.chat_session_id
              WHERE cs.type = 'dm' AND p1.user_id = ? AND p2.user_id = ?
            ''', (sender_id, recipient_id)).fetchone()
        if chat:
            return ChatSession(id=chat[0])
        
        chat_id = str(uuid.uuid4())
        c.execute('INSERT INTO chat_sessions (id, type, started_at) VALUES (?, ?, ?)', (chat_id, 'dm', datetime.now().isoformat()))
        c.execute('INSERT INTO chat_participants (chat_session_id, user_id) VALUES (?, ?)', (chat_id, sender_id))
        c.execute('INSERT INTO chat_participants (chat_session_id, user_id) VALUES (?, ?)', (chat_id, recipient_id))
        self.connection.commit()
        return ChatSession(id=chat_id)

    def is_user_in_chat(self, user_id, chat_id):
      c = self.connection.cursor()
      c.execute('''
          SELECT 1 FROM chat_participants
          WHERE chat_session_id = ? AND user_id = ?
          LIMIT 1
      ''', (chat_id, user_id))
      return c.fetchone() is not None
    
    def send_message_to_group(self, sender_id, group_id, content):
        pass

    def get_user_chats(self, user_id):
        c = self.connection.cursor()
        print(f"Getting chats for user_id: {user_id}")
        
        c.execute('''
            SELECT cs.id, cs.type, cs.group_id, g.name as group_name,
                   m.content as last_message, m.timestamp as last_message_time,
                   u.username as last_sender
            FROM chat_sessions cs
            JOIN chat_participants cp ON cs.id = cp.chat_session_id
            LEFT JOIN groups g ON cs.group_id = g.id
            LEFT JOIN (
                SELECT chat_session_id, content, timestamp, sender_id
                FROM messages
                WHERE (chat_session_id, timestamp) IN (
                    SELECT chat_session_id, MAX(timestamp)
                    FROM messages
                    GROUP BY chat_session_id
                )
            ) m ON cs.id = m.chat_session_id
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE cp.user_id = ?
            ORDER BY m.timestamp DESC
        ''', (user_id,))
        
        chats = []
        for row in c.fetchall():
            chat_id, chat_type, group_id, group_name, last_message, last_time, last_sender = row
            
            # Determine chat name
            if chat_type == 'group' and group_name:
                chat_name = f"Grupo: {group_name}"
            else:
                # For DM, get the other participant's name
                c2 = self.connection.cursor()
                c2.execute('''
                    SELECT u.username
                    FROM chat_participants cp
                    JOIN users u ON cp.user_id = u.id
                    WHERE cp.chat_session_id = ? AND cp.user_id != ?
                ''', (chat_id, user_id))
                other_user = c2.fetchone()
                chat_name = f"Chat com {other_user[0]}" if other_user else "Chat privado"
            
            chats.append({
                'id': chat_id,
                'name': chat_name,
                'last_message': last_message or "Nenhuma mensagem ainda",
                'last_message_time': last_time,
                'last_sender': last_sender
            })
        
        return chats

    def create_session(self, session: Session) -> Session:
        print(f"Creating session for user_id: {session.user_id}, username: {session.username}, session_id: {session.session_id}, created_at: {session.created_at}")
        c = self.connection.cursor()
        c.execute('''
            INSERT INTO sessions (session_id, user_id, username, created_at, last_seen, is_expired)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            session.session_id,
            session.user_id,
            session.username,
            session.created_at,
            session.last_seen,
            session.is_expired
        ))
        self.connection.commit()
        return session
    
    def get_session(self, session_id: str, user_id: str) -> Session:
        c = self.connection.cursor()
        c.execute('SELECT * FROM sessions WHERE session_id = ? AND user_id = ?', (session_id, user_id))
        row = c.fetchone()
        if row:
            return Session(
                user_id=row[1],
                username=row[2],
                session_id=row[0],
                created_at=row[3],
                last_seen=row[4],
                is_expired=row[5]
            )
        return None