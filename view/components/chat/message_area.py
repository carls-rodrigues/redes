from nicegui import ui
from typing import List, Dict, Any

class MessageArea:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.loaded_message_ids = set()
        self.container = ui.column().classes('w-full flex-grow p-4 h-[70vh] overflow-y-auto bg-white rounded-lg shadow-inner message-container')

    def add_message(self, message_data: Dict[str, Any]):
        """Add a message to the message area"""
        msg_id = message_data.get("id")
        if msg_id and msg_id not in self.loaded_message_ids:
            self.loaded_message_ids.add(msg_id)
            sent = str(message_data.get("sender_id")) == str(self.user_id)
            name = "Você" if sent else message_data.get("sender_username", "Unknown")
            text = message_data.get("content", "")

            with self.container:
                if sent:
                    with ui.row().classes('w-full justify-end mb-2'):
                        with ui.column().classes('items-end'):
                            ui.label(name).classes('text-xs text-gray-500')
                            ui.label(text).classes('bg-blue-500 text-white p-2 rounded-lg max-w-xs break-words')
                else:
                    with ui.row().classes('w-full justify-start mb-2'):
                        with ui.column().classes('items-start'):
                            ui.label(name).classes('text-xs text-gray-500')
                            ui.label(text).classes('bg-gray-200 p-2 rounded-lg max-w-xs break-words')

            # Scroll to bottom
            ui.run_javascript('setTimeout(() => { const el = document.querySelector(".message-container"); if (el) el.scrollTop = el.scrollHeight; }, 100);')

    def load_messages(self, messages: List[Dict[str, Any]]):
        """Load initial messages"""
        for msg in messages:
            self.add_message(msg)

    def clear(self):
        """Clear all messages"""
        self.container.clear()
        self.loaded_message_ids.clear()