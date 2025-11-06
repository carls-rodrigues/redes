from nicegui import ui
from typing import Callable

class MessageInput:
    def __init__(self, on_send: Callable[[str], None]):
        self.on_send = on_send
        self.placeholder = "Digite sua mensagem..."

        # Create refreshable input
        @ui.refreshable
        def input_ui():
            self._create_ui()

        self.input_ui = input_ui
        # Don't render immediately - let the layout control when to render

    def _create_ui(self):
        """Create the input UI"""
        with ui.row().classes("w-full p-4 bg-gray-50 rounded-b-lg"):
            self.input_field = ui.input(self.placeholder).props("outlined").classes("flex-grow")
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

    def set_placeholder(self, placeholder: str):
        """Update placeholder and refresh"""
        self.placeholder = placeholder
        self.input_ui.refresh()

    def set_on_send(self, on_send: Callable[[str], None]):
        """Update send handler"""
        self.on_send = on_send