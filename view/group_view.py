from nicegui import ui



def group_screen(session: str = None):
    # Validate session
    # if not session or not session_manager.get_session(session):
    #     ui.navigate.to('/')
    #     return

    ui.label('Gerenciar Grupos').classes('text-2xl font-bold mt-4 mx-4')
    ui.separator().classes('my-2')

    with ui.column().classes('mx-4 space-y-3'):
        group_name = ui.input('Nome do grupo').props('outlined')
        members = ui.input('Adicionar membro (usuário)').props('outlined')
        ui.button('Adicionar', on_click=lambda: add_member(members.value)).classes('bg-blue-500 text-white')
        ui.button('Salvar grupo', on_click=lambda: ui.notify('Grupo criado!')).classes('bg-green-500 text-white')

    ui.link('Voltar', f'/dashboard?session={session}').classes('block mx-4 mt-4 text-blue-600')

def add_member(username):
    ui.notify(f'{username} adicionado ao grupo')
