import uuid
from datetime import datetime

class User:
    def __init__(self, username, id=None, connection_id=None, last_seen=None):
        self.id = id or str(uuid.uuid4())  # UUID as string
        self.username = username
        self.connection_id = connection_id or str(uuid.uuid4())  # Unique connection ID
        self.last_seen = last_seen or datetime.now()  # Timestamp

class Group:
    def __init__(self, name, id=None, created_at=None):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.created_at = created_at or datetime.now()

class Message:
    def __init__(self, sender_id, chat_id, content, group_id=None, id=None, timestamp=None):
        self.id = id or str(uuid.uuid4())
        self.sender_id = sender_id
        self.chat_id = chat_id
        self.group_id = group_id
        self.content = content
        self.timestamp = timestamp or datetime.now().isoformat()

class ChatSession:
    def __init__(self, type=None, group_id=None, id=None, started_at=None):
        self.id = id or str(uuid.uuid4())
        self.type = type or "dm"
        self.group_id = group_id
        self.started_at = started_at or datetime.now().isoformat()

class UserGroup:
    def __init__(self, user_id, group_id, joined_at=None, role=None):
        self.user_id = user_id
        self.group_id = group_id
        self.joined_at = joined_at or datetime.now()
        self.role = role or "member"  # e.g., "admin", "member", "owner"

class ChatParticipant:
    def __init__(self, chat_id, user_id):
        self.chat_id = chat_id
        self.user_id = user_id

class Session:
    def __init__(self, user_id, username, session_id=None, created_at=None, last_seen=None, is_expired=False):
        self.session_id = session_id or str(uuid.uuid4())
        self.user_id = user_id
        self.username = username
        self.created_at = created_at or datetime.now().isoformat()
        self.last_seen = last_seen or datetime.now().isoformat()
        self.is_expired = is_expired