from nicegui import ui
from .chat_header import chat_header
from .message_area import MessageArea
from .message_input import MessageInput
from utils.socket_client import client
from typing import Dict, Any, Optional

class ChatRoomComponent:
    def __init__(self, chat_id: str, session: Dict[str, Any], on_back_click=None):
        self.chat_id = chat_id
        self.session = session
        self.username = session.get('username')
        self.user_id = session.get('user_id')
        self.on_back_click = on_back_click

        # Create components
        self.header = None
        self.message_area = MessageArea(self.user_id)
        self.message_input = None

        # State
        self.loaded_message_ids = set()

        self._create_ui()
        self._setup_message_handling()

    def _create_ui(self):
        """Create the complete chat room UI"""
        # Header
        chat_header(self.username, self.on_back_click)

        ui.separator()

        # Message area (already created in __init__)

        # Message input
        def send_message(content: str):
            self._send_message(content)

        self.message_input = MessageInput(send_message)

    def _setup_message_handling(self):
        """Setup real-time message handling"""
        if client.connected:
            client.set_incoming_handler(self._handle_incoming_message)

        # Check for incoming messages frequently
        ui.timer(0.1, lambda: self._check_incoming_messages())

    def _check_incoming_messages(self):
        """Check for incoming messages in the queue"""
        while not client.incoming_queue.empty():
            msg = client.incoming_queue.get()
            self._handle_incoming_message(msg)

    def _handle_incoming_message(self, msg: Dict[str, Any]):
        """Handle incoming real-time messages"""
        if str(msg.get("chat_id")) == str(self.chat_id):
            msg_data = msg.get("message", {})
            self.message_area.add_message(msg_data)

    def _send_message(self, content: str):
        """Send a message"""
        if not content.strip():
            return

        if not client.connected:
            client.connect()

        msg_data = {
            "type": "message",
            "chat_id": self.chat_id,
            "content": content,
            "session": self.session
        }

        response = client.send_message(msg_data)
        if response and response.get("status") == "ok":
            # Add the message ID to our tracking set
            msg_id = response.get("message_id")
            if msg_id:
                self.loaded_message_ids.add(msg_id)

            # Add message to UI
            message_data = {
                "id": msg_id,
                "sender_id": self.user_id,
                "sender_username": self.username,
                "content": content
            }
            self.message_area.add_message(message_data)
        else:
            ui.notify("Erro ao enviar mensagem", type="negative")

    def load_messages(self):
        """Load initial messages for the chat"""
        if not client.connected:
            client.connect()

        response = client.send_message({
            "type": "get_messages",
            "chat_id": self.chat_id,
            "session": self.session
        })

        if response and response.get("status") == "ok":
            messages = response.get("messages", [])
            self.message_area.load_messages(messages)
        else:
            ui.notify("Erro ao carregar mensagens", type="negative")