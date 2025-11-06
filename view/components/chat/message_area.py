from nicegui import ui
from typing import List, Dict, Any

class MessageArea:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.messages: List[Dict[str, Any]] = []
        self.loaded_message_ids = set()

        # Create refreshable UI function
        @ui.refreshable
        def message_ui():
            self._render_messages()

        self.message_ui = message_ui
        # Don't render immediately - let the layout control when to render

    def _render_messages(self):
        """Internal method to render all messages"""
        with ui.column().classes('w-full h-full p-4 overflow-y-auto bg-gray-50 message-container scroll-smooth'):
            if not self.messages:
                ui.label('No messages yet').classes('text-center text-gray-500 py-8')
                return

            for msg_data in self.messages:
                self._render_single_message(msg_data)

            # Scroll to bottom after rendering
            ui.run_javascript('setTimeout(() => { const el = document.querySelector(".message-container"); if (el) el.scrollTop = el.scrollHeight; }, 100);')

    def _render_single_message(self, message_data: Dict[str, Any]):
        """Render a single message"""
        sent = str(message_data.get("sender_id")) == str(self.user_id)
        name = "Você" if sent else message_data.get("sender_username", "Unknown")
        text = message_data.get("content", "")

        with ui.row().classes('w-full justify-end mb-2') if sent else ui.row().classes('w-full justify-start mb-2'):
            with ui.column().classes('items-end') if sent else ui.column().classes('items-start'):
                ui.label(name).classes('text-xs text-gray-500')
                if sent:
                    ui.label(text).classes('bg-blue-500 text-white p-2 rounded-lg max-w-xs break-words')
                else:
                    ui.label(text).classes('bg-gray-200 p-2 rounded-lg max-w-xs break-words')

    def add_message(self, message_data: Dict[str, Any]):
        """Add a message and refresh the UI"""
        msg_id = message_data.get("id")
        if msg_id and msg_id not in self.loaded_message_ids:
            self.loaded_message_ids.add(msg_id)
            self.messages.append(message_data)
            self.message_ui.refresh()  # 🔄 Trigger UI update

    def load_messages(self, messages: List[Dict[str, Any]]):
        """Load initial messages and refresh"""
        self.messages = messages.copy()
        self.loaded_message_ids.clear()
        for msg in messages:
            msg_id = msg.get("id")
            if msg_id:
                self.loaded_message_ids.add(msg_id)
        self.message_ui.refresh()

    def clear(self):
        """Clear all messages"""
        self.messages.clear()
        self.loaded_message_ids.clear()
        self.message_ui.refresh()