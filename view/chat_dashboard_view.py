from nicegui import ui

def dashboard_screen():
    with ui.row().classes('justify-between items-center mt-4 mx-4'):
        ui.label('Seus Chats').classes('text-2xl font-bold')
        ui.button('Criar Grupo', on_click=lambda: ui.navigate.to('/groups')).classes('bg-blue-500 text-white')

    ui.separator().classes('my-2')

    with ui.column().classes('mx-4 space-y-2'):
        # TODO: replace with dynamic list from DB

        with ui.card().classes('p-3 w-full cursor-pointer hover:bg-gray-100').on('click', lambda: ui.navigate.to('/chat/1')):
            ui.label('Chat com João').classes('text-lg')
            ui.label('Última mensagem: tudo bem?').classes('text-sm text-gray-500')

        with ui.card().classes('p-3 w-full cursor-pointer hover:bg-gray-100').on('click', lambda: ui.navigate.to('/chat/2')):
            ui.label('Grupo: Projeto RedES').classes('text-lg')
            ui.label('Última mensagem: reunião amanhã!').classes('text-sm text-gray-500')
