from nicegui import ui
from typing import Callable

class MessageInput:
    def __init__(self, on_send: Callable[[str], None]):
        self.on_send = on_send
        self.input_field = None
        self._create_ui()

    def _create_ui(self):
        """Create the input UI"""
        with ui.row().classes("w-full p-4 bg-gray-50 rounded-b-lg"):
            self.input_field = ui.input("Digite sua mensagem...").props("outlined").classes("flex-grow")
            self.input_field.on('keydown.enter', lambda: self._send_message())
            ui.button("Enviar", on_click=self._send_message).classes("bg-blue-500 text-white")

    def _send_message(self):
        """Send the message and clear input"""
        content = self.input_field.value.strip()
        if content:
            self.on_send(content)
            self.input_field.value = ""

    def clear(self):
        """Clear the input field"""
        if self.input_field:
            self.input_field.value = ""

    def focus(self):
        """Focus the input field"""
        if self.input_field:
            self.input_field.focus()