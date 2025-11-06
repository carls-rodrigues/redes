from nicegui import ui
from design_tokens import Colors, Typography, Spacing, BorderRadius, Borders, Layout

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
        """Render the header with design system styling"""
        with ui.row().classes('justify-between items-center w-full').style(
            f'background-color: {Colors.WHITE}; '
            f'border-bottom: 1px solid {Colors.BORDER}; '
            f'padding: {Spacing.LG} {Spacing.XXL}; '
            f'height: {Layout.HEADER_HEIGHT}; '
            f'align-items: center; '
            f'box-shadow: {Colors.MUTED};'
        ):
            # Title
            title = ui.label(f'Chat de {self.username}').classes('text-xl font-semibold').style(
                f'color: {Colors.DARK_GRAY}; '
                f'font-size: 16px; '
                f'font-weight: 500;'
            )
            
            # Back button
            back_btn = ui.button('← Voltar').style(
                f'background-color: transparent; '
                f'color: {Colors.PRIMARY}; '
                f'border: none; '
                f'padding: {Spacing.SM} {Spacing.LG}; '
                f'border-radius: {BorderRadius.MEDIUM}; '
                f'cursor: pointer; '
                f'font-size: {Typography.Size.BODY}; '
                f'font-weight: 500; '
                f'transition: all 150ms ease-in-out;'
            )
            
            back_btn.on('click', self.on_back_click or (lambda: ui.navigate.to('/')))
            
            # Hover effect
            back_btn.on('mouseenter', lambda: back_btn.style(
                f'background-color: {Colors.LIGHT_GRAY}; color: {Colors.PRIMARY};'
            ))
            back_btn.on('mouseleave', lambda: back_btn.style(
                f'background-color: transparent; color: {Colors.PRIMARY};'
            ))

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