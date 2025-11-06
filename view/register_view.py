from nicegui import ui

def register_screen():
    with ui.card().classes('w-96 mx-auto mt-24 p-6 shadow-lg rounded-xl'):
        ui.label('Registrar').classes('text-2xl font-bold mb-4 text-center')
        username = ui.input('Usuário').props('outlined').classes('mb-2')
        password = ui.input('Senha', password=True).props('outlined').classes('mb-4')
        status = ui.label().classes('text-red-500 text-sm mb-2')

        def register():
            if username.value and password.value:
                # TODO: integrate with AuthService
                ui.navigate.to('/')
            else:
                status.set_text('Todos os campos são obrigatórios!')

        ui.button('Registrar', on_click=register).classes('w-full bg-green-500 text-white')
        ui.link('Já tem conta? Entrar', '/').classes('text-center block mt-2 text-sm text-blue-600')
