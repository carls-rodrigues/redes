from nicegui import ui

class ChatHeader:
    def __init__(self, username: str, on_back_click=None):
        self.username = username
        self.on_back_click = on_back_click

        # Create refreshable header
        @ui.refreshable
        def header_ui():
            self._render_header()

        self.header_ui = header_ui
        # Don't render immediately - let the layout control when to render

    def _render_header(self):
        """Render the header"""
        with ui.row().classes('justify-between items-center p-4 bg-gray-100 w-full'):
            ui.label(f'Chat de {self.username}').classes('text-xl font-semibold')
            ui.button('Voltar', on_click=self.on_back_click or (lambda: ui.navigate.to('/'))).props('outline round dense')

    def update_username(self, username: str):
        """Update the username and refresh the header"""
        self.username = username
        self.header_ui.refresh()

    def update_back_click(self, on_back_click):
        """Update the back click handler and refresh"""
        self.on_back_click = on_back_click
        self.header_ui.refresh()

# Keep the function version for backward compatibility
def chat_header(username: str, on_back_click=None):
    """Chat header component with username and back button (function version)"""
    return ChatHeader(username, on_back_click)