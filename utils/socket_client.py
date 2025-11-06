import socket
import json
import threading
import queue
import time
from typing import Optional, Callable, Dict, Any

class SocketClient:
    def __init__(self, host: str = '127.0.0.1', port: int = 5000):
        self.host = host
        self.port = port
        self.sock: Optional[socket.socket] = None
        self.connected = False
        self.response_queue = queue.Queue()
        self.listener_thread: Optional[threading.Thread] = None
        self.message_handlers: Dict[str, Callable] = {}
        self.session = None

    def connect(self) -> bool:
        """Connect to the socket server"""
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((self.host, self.port))
            self.connected = True

            # Start listener thread
            self.listener_thread = threading.Thread(target=self._listen_for_messages, daemon=True)
            self.listener_thread.start()

            return True
        except Exception as e:
            print(f"Failed to connect: {e}")
            return False

    def disconnect(self):
        """Disconnect from the server"""
        self.connected = False
        if self.sock:
            self.sock.close()
        if self.listener_thread:
            self.listener_thread.join(timeout=1)

    def send_message(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send a message and wait for response"""
        if not self.connected or not self.sock:
            print("Not connected to server")
            return None
            
        try:
            data = json.dumps(message).encode()
            self.sock.sendall(data)

            # Wait for response with timeout
            return self._wait_for_response(timeout=5.0)
        except Exception as e:
            print(f"Error sending message: {e}")
            return None

    def _wait_for_response(self, timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """Wait for a response from the server"""
        try:
            response = self.response_queue.get(timeout=timeout)
            return response
        except queue.Empty:
            return None

    def _listen_for_messages(self):
        """Listen for incoming messages from server"""
        while self.connected and self.sock:
            try:
                data = self.sock.recv(4096)
                if not data:
                    break

                message = json.loads(data.decode())
                self.response_queue.put(message)

                # Handle real-time messages (like incoming chat messages)
                if 'chat_id' in message:
                    self._handle_incoming_message(message)

            except Exception as e:
                print(f"Error receiving message: {e}")
                break

        self.connected = False

    def _handle_incoming_message(self, message: Dict[str, Any]):
        """Handle incoming real-time messages"""
        # This can be extended to notify UI components
        print(f"Incoming message: {message}")

    def register_handler(self, message_type: str, handler: Callable):
        """Register a handler for specific message types"""
        self.message_handlers[message_type] = handler

    def login(self, username: str, password: str):
        response = self.send_message({
            "type": "login",
            "username": username,
            "password": password
        })

        if response.get("status") == "ok":
            self.session = response
            return response
        return None

    def register(self, username: str, password: str) -> bool:
        """Register a new user"""
        response = self.send_message({
            "type": "register",
            "username": username,
            "password": password
        })

        return response and response.get("status") == "registered"

    def send_chat_message(self, content: str, chat_id: Optional[str] = None,
                         group_id: Optional[str] = None, recipient_id: Optional[str] = None) -> bool:
        """Send a chat message"""
        message = {
            "type": "message",
            "content": content
        }

        if chat_id:
            message["chat_id"] = chat_id
        if group_id:
            message["group_id"] = group_id
        if recipient_id:
            message["recipient_id"] = recipient_id

        response = self.send_message(message)
        return response is not None

    def get_user_chats(self, session) -> Optional[list]:
        """Get all chats for the current user"""
        response = self.send_message({
            "type": "get_user_chats",
            "session": session
        })

        if response and response.get("status") == "ok":
            return response.get("chats", [])
        return None

client = SocketClient()