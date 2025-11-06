from nicegui import ui
from .chat_header import ChatHeader
from .message_area import MessageArea
from .message_input import MessageInput
from utils.socket_client import client
from design_tokens import Colors, Spacing, Layout
from typing import Dict, Any, Optional

class ChatRoomComponent:
    def __init__(self, chat_id: str, session: Dict[str, Any], on_back_click=None):
        self.chat_id = chat_id
        self.session = session
        self.username = session.get('username')
        self.user_id = session.get('user_id')
        self.on_back_click = on_back_click

        # Create components
        self.message_area = MessageArea(self.user_id)
        self.header = None
        self.message_input = None

        self._create_ui()
        self._setup_message_handling()

    def _create_ui(self):
        """Create the complete chat room UI with design system styling"""
        # Main container with full height
        with ui.column().classes('h-full w-full').style(
            f'background-color: {Colors.WHITE}; '
            f'display: flex; flex-direction: column; height: 100vh;'
        ):
            # Fixed header at top
            self.header = ChatHeader(self.username, self.on_back_click)
            self.header.header_ui()

            # Message area takes remaining space (full width)
            with ui.column().classes('flex-grow overflow-hidden w-full').style(
                f'flex: 1; overflow: hidden; background-color: {Colors.WHITE};'
            ):
                self.message_area.message_ui()

            # Fixed input at bottom
            def send_message(content: str):
                self._send_message(content)

            self.message_input = MessageInput(send_message)
            self.message_input.input_ui()

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
            self.message_area.add_message(msg_data)  # Auto-refreshes UI!

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
            # Add message to UI immediately (MessageArea will auto-refresh)
            message_data = {
                "id": response.get("message_id"),
                "sender_id": self.user_id,
                "sender_username": self.username,
                "content": content
            }
            self.message_area.add_message(message_data)  # Auto-refreshes UI!
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
            self.message_area.load_messages(messages)  # Auto-refreshes UI!
        else:
            ui.notify("Erro ao carregar mensagens", type="negative")