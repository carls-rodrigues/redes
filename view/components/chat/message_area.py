from nicegui import ui
from typing import List, Dict, Any
from design_tokens import Colors, Typography, Spacing, BorderRadius, Shadows

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
        """Internal method to render all messages with design system styling"""
        with ui.column().classes('w-full h-full p-4 overflow-y-auto message-container scroll-smooth').style(
            f'background-color: {Colors.WHITE}; '
            f'padding: {Spacing.LG}; '
        ):
            if not self.messages:
                ui.label('Nenhuma mensagem ainda').classes('text-center py-8').style(
                    f'color: {Colors.MEDIUM_GRAY}; '
                )
                return

            for msg_data in self.messages:
                self._render_single_message(msg_data)

            # Scroll to bottom after rendering
            ui.run_javascript('setTimeout(() => { const el = document.querySelector(".message-container"); if (el) el.scrollTop = el.scrollHeight; }, 100);')

    def _render_single_message(self, message_data: Dict[str, Any]):
        """Render a single message with design system styling"""
        sent = str(message_data.get("sender_id")) == str(self.user_id)
        name = "Você" if sent else message_data.get("sender_username", "Unknown")
        text = message_data.get("content", "")
        timestamp = message_data.get("timestamp", "")

        with ui.row().classes(f'w-full gap-3 py-2 {"flex-row-reverse" if sent else ""}'):
            # Avatar
            avatar_bg = Colors.PRIMARY if sent else Colors.SECONDARY
            avatar_fg = Colors.PRIMARY_FOREGROUND if sent else Colors.PRIMARY
            
            with ui.element('div').classes('w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center') as avatar:
                avatar.style(
                    f'background-color: {avatar_bg}; '
                    f'display: flex; align-items: center; justify-content: center; '
                    f'flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;'
                )
                avatar_label = ui.label(name[0].upper() if name else 'U').classes('text-xs font-semibold')
                avatar_label.style(f'color: {avatar_fg}; font-weight: 600;')
            
            # Message content container
            with ui.column().classes(f'{"items-end" if sent else "items-start"} gap-1 flex-grow'):
                # Message bubble
                message_bg = Colors.SECONDARY if sent else Colors.LIGHT_GRAY
                message_fg = Colors.DARK_GRAY
                
                with ui.element('div').classes('px-4 py-3 rounded-2xl max-w-xs break-words') as bubble:
                    bubble.style(
                        f'background-color: {message_bg}; '
                        f'color: {message_fg}; '
                        f'border-radius: {BorderRadius.EXTRA_LARGE}; '
                        f'padding: {Spacing.MD} {Spacing.LG}; '
                        f'box-shadow: {Shadows.SUBTLE};'
                    )
                    message_label = ui.label(text).classes('text-sm leading-relaxed')
                    message_label.style(f'color: {message_fg}; line-height: 1.5;')
                
                # Timestamp
                if timestamp:
                    ts_label = ui.label(timestamp).classes('text-xs')
                    ts_label.style(f'color: {Colors.MEDIUM_GRAY}; font-size: 11px;')

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