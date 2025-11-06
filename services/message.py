import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import uuid
from services.users import UsersService
from models.models import Message

from database.db import Database

class MessageService:
    def __init__(self, db: Database, usersService=None):
        self.db = db
        self.user_service = usersService or UsersService(self.db)

    def send_message(self, sender_id, content, chat_id=None, group_id=None, recipient_id=None):
        sender = self.user_service.get_user_by_id(sender_id)
        if not sender:
            raise ValueError("Sender does not exist.")

        chat = None
        print(f"Recipient ID: {recipient_id}, Group ID: {group_id}, Chat ID: {chat_id}")
        if group_id:
            group = self.db.get_group(group_id)
            if not group:
                raise ValueError("Group does not exist.")

            chat = self.db.get_chat_session_by_group_id(group_id)
            if not chat:
                chat = self.db.create_chat_session(session_type="group", group_id=group_id)

        elif recipient_id:
            recipient = self.user_service.get_user_by_id(recipient_id)
            if not recipient:
                raise ValueError("Recipient does not exist.")

            chat = self.db.get_or_create_dm_chat(sender_id, recipient_id)

        elif chat_id:
            chat = self.db.get_chat_session(chat_id)
            if not chat:
                raise ValueError("Chat session not found.")
        else:
            raise ValueError("Either group_id, recipient_id, or chat_id must be provided.")

        if not self.db.is_user_in_chat(sender_id, chat.id):
            raise PermissionError("Sender is not a participant of this chat.")

        message = Message(sender_id, chat_id=chat.id, content=content, group_id=group_id)
        self.db.save_message(message)

        return message


    
    def get_chat_messages(self, user_id, chat_id):
        return self.db.list_chat_messages(user_id, chat_id)
    
    def get_user_chats(self, user_id):
        """Get all chats for a user with names and last messages"""
        return self.db.get_user_chats(user_id)
    
