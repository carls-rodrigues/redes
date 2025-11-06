from nicegui import ui

def chat_header(username: str, on_back_click=None):
    """Chat header component with username and back button"""
    with ui.row().classes('justify-between items-center p-4 bg-gray-100 w-full'):
        ui.label(f'Chat de {username}').classes('text-xl font-semibold')
        ui.button('Voltar', on_click=on_back_click or (lambda: ui.navigate.to('/'))).props('outline round dense')