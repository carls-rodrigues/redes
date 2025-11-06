from nicegui import ui

def login_screen():
    with ui.card().classes('w-96 mx-auto mt-24 p-6 shadow-lg rounded-xl'):
        ui.label('Login').classes('text-2xl font-bold mb-4 text-center')
        username = ui.input('Usuário').props('outlined').classes('mb-2 w-full rounded-sm')
        password = ui.input('Senha', password=True).props('outlined').classes('mb-4 w-full rounded-sm')
        status = ui.label().classes('text-red-500 text-sm mb-2')

        def login():
            # TODO: Replace with real auth via socket or service
            if username.value and password.value:
                ui.navigate.to('/dashboard')
            else:
                status.set_text('Preencha todos os campos!')

        ui.button('Entrar', on_click=login).classes('w-full bg-blue-500 text-white')
        ui.link('Criar conta', '/register').classes('text-center block mt-2 text-sm text-blue-600')
