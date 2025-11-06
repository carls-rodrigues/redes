from nicegui import ui

@ui.refreshable
def message_component(message: str, sender: str, is_own: bool):
    with ui.row().classes('w-full mb-2'):
        with ui.column().classes('items-end' if is_own else 'items-start'):
            ui.label(sender).classes('text-xs text-gray-500')
            ui.label(message).classes('bg-blue-500 text-white p-2 rounded-lg max-w-xs break-words' if is_own else 'bg-gray-200 p-2 rounded-lg max-w-xs break-words')