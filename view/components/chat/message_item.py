from nicegui import ui
from design_tokens import Colors, Typography, Spacing, BorderRadius, Shadows

@ui.refreshable
def message_component(message: str, sender: str, is_own: bool, timestamp: str = None):
    """
    Render a single message bubble with design system styling.
    
    Args:
        message: The message content
        sender: The sender's name/identifier
        is_own: True if this is the current user's message
        timestamp: Optional timestamp for the message
    """
    with ui.row().classes(f'w-full gap-3 py-2 {"flex-row-reverse" if is_own else ""}'):
        # Avatar
        avatar_bg = Colors.PRIMARY if is_own else Colors.SECONDARY
        avatar_fg = Colors.PRIMARY_FOREGROUND if is_own else Colors.PRIMARY
        with ui.element('div').classes(f'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center') as avatar:
            avatar.style(f'background-color: {avatar_bg}; display: flex; align-items: center; justify-content: center;')
            ui.label(sender[0].upper() if sender else 'U').classes(f'text-xs font-semibold').style(f'color: {avatar_fg}; font-weight: 600;')
        
        # Message content container
        with ui.column().classes(f'{"items-end" if is_own else "items-start"} gap-1'):
            # Message bubble
            message_bg = Colors.SECONDARY if is_own else 'transparent'
            message_fg = Colors.DARK_GRAY
            
            with ui.element('div').classes('px-4 py-3 rounded-2xl max-w-xs break-words') as bubble:
                bubble.style(
                    f'background-color: {message_bg}; '
                    f'color: {message_fg}; '
                    f'border-radius: {BorderRadius.EXTRA_LARGE}; '
                    f'padding: {Spacing.MD} {Spacing.LG};'
                )
                ui.label(message).classes('text-sm leading-relaxed').style(f'color: {message_fg};')
            
            # Timestamp
            if timestamp:
                ui.label(timestamp).classes('text-xs').style(f'color: {Colors.MEDIUM_GRAY}; font-size: 11px;')