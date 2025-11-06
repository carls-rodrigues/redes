from nicegui import ui
from .chat_header import ChatHeader
from .message_area import MessageArea
from .message_input import MessageInput
from utils.socket_client import client
from design_tokens import Colors, Spacing, Layout
from typing import Dict, Any, Optional

class ChatRoomComponent:
    def __init__(self, chat_id: str, session: Dict[str, Any], on_back_click=None, on_message_sent=None, on_message_received=None):
        self.chat_id = chat_id
        self.session = session
        self.username = session.get('username')
        self.user_id = session.get('user_id')
        self.on_back_click = on_back_click
        self.on_message_sent = on_message_sent  # Callback when message is sent
        self.on_message_received = on_message_received  # Callback when message is received
        self.last_message_id = None  # Track last message ID to avoid polling unnecessarily

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
        # Check for incoming messages frequently
        ui.timer(0.1, lambda: self._check_incoming_messages())
        
        # Polling state - only poll when messages are being actively sent
        self.polling_active = False
        
        # Poll for new messages with ADAPTIVE interval
        ui.timer(0.5, lambda: self._poll_new_messages_adaptive())
    
    def _enable_polling(self):
        """Enable polling temporarily after a message is detected"""
        self.polling_active = True
        # Auto-disable after 5 seconds of inactivity
        def disable():
            self.polling_active = False
        ui.timer(5.0, disable, once=True)

    def _check_incoming_messages(self):
        """Check for incoming messages in the queue"""
        import queue
        while True:
            try:
                msg = client.incoming_queue.get_nowait()
                self._handle_incoming_message(msg)
            except queue.Empty:
                break
    
    def _poll_new_messages(self):
        """Periodically poll for new messages - OPTIMIZED to avoid unnecessary DB queries"""
        try:
            # First, just check if there are new messages by getting the count
            # This is faster than loading all messages
            if not client.connected:
                client.connect()
            
            # Get only the last message to check if it's new
            response = client.send_message({
                "type": "get_messages",
                "chat_id": self.chat_id,
                "session": self.session,
                "limit": 1  # Only get the last message for comparison
            })
            
            if response and response.get("status") == "ok":
                messages = response.get("messages", [])
                if messages:
                    last_msg = messages[0]  # Latest message
                    msg_id = last_msg.get("id")
                    
                    # Only fetch all messages if we have a NEW message
                    if msg_id != self.last_message_id:
                        self.last_message_id = msg_id
                        
                        # Now fetch all messages
                        response = client.send_message({
                            "type": "get_messages",
                            "chat_id": self.chat_id,
                            "session": self.session
                        })
                        
                        if response and response.get("status") == "ok":
                            all_messages = response.get("messages", [])
                            # Add only new messages
                            for msg in all_messages:
                                msg_id = msg.get("id")
                                if msg_id not in self.message_area.loaded_message_ids:
                                    self.message_area.add_message(msg)
                    else:
                        # No new messages, don't query DB
                        pass
        except Exception as e:
            print(f"[_poll_new_messages] Error polling messages: {e}")
    
    def _poll_new_messages_adaptive(self):
        """Adaptive polling - only polls when actively needed"""
        if not self.polling_active:
            return  # Don't poll if not actively needed
        
        self._poll_new_messages()

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
            
            # Enable polling to detect receiver's messages
            self._enable_polling()
            
            # Notify parent that a message was sent (update chat card)
            if self.on_message_sent:
                self.on_message_sent(content)
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
            
            # Track the last message ID to avoid unnecessary polling
            if messages:
                self.last_message_id = messages[-1].get("id")  # Last message in the list
        else:
            ui.notify("Erro ao carregar mensagens", type="negative")