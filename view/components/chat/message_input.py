from nicegui import ui
from typing import Callable
from design_tokens import Colors, Typography, Spacing, BorderRadius, Shadows

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
        """Create the input UI with design system styling"""
        with ui.row().classes("w-full gap-3 p-4").style(
            f'background-color: {Colors.LIGHT_GRAY}; '
            f'padding: {Spacing.LG}; '
            f'border-top: 1px solid {Colors.BORDER}; '
            f'border-radius: 0 0 8px 8px;'
        ):
            # Input field
            self.input_field = ui.input(self.placeholder).props("outlined").classes("flex-grow").style(
                f'background-color: {Colors.WHITE}; '
                f'color: {Colors.DARK_GRAY}; '
                f'border: 1px solid {Colors.BORDER}; '
                f'border-radius: {BorderRadius.PILL}; '
                f'padding: {Spacing.MD} {Spacing.LG}; '
                f'font-size: {Typography.Size.BODY}; '
            )
            
            # Styling the input's placeholder
            self.input_field.style(
                f'--webkit-autofill-bg: {Colors.WHITE}; '
                f'color: {Colors.DARK_GRAY};'
            )
            
            self.input_field.on('keydown.enter', lambda: self._send_message())
            
            # Send button
            send_btn = ui.button("Enviar", on_click=self._send_message).style(
                f'background-color: {Colors.PRIMARY}; '
                f'color: {Colors.PRIMARY_FOREGROUND}; '
                f'border: none; '
                f'border-radius: {BorderRadius.MEDIUM}; '
                f'padding: {Spacing.SM} {Spacing.LG}; '
                f'font-weight: 600; '
                f'cursor: pointer; '
                f'transition: all 150ms ease-in-out; '
            )
            
            # Hover effect
            send_btn.on('mouseenter', lambda: send_btn.style(
                f'background-color: #2E3CB5; opacity: 0.9;'
            ))
            send_btn.on('mouseleave', lambda: send_btn.style(
                f'background-color: {Colors.PRIMARY}; opacity: 1;'
            ))

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