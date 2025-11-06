from nicegui import ui
from utils.socket_client import client

def register_screen():
    with ui.card().classes('w-96 mx-auto mt-24 p-6 shadow-lg rounded-xl'):
        ui.label('Registrar').classes('text-2xl font-bold mb-4 text-center')
        username = ui.input('Usuário').props('outlined').classes('mb-2')
        password = ui.input('Senha', password=True).props('outlined').classes('mb-4')
        status = ui.label().classes('text-red-500 text-sm mb-2')

        def register():
            if not username.value or not password.value:
                status.set_text('Todos os campos são obrigatórios!')
                return

            # Connect to server if not connected
            if not client.connected:
                if not client.connect():
                    status.set_text('Erro ao conectar ao servidor!')
                    return

            # Attempt registration
            if client.register(username.value, password.value):
                status.set_text('Conta criada com sucesso! Faça login.')
                status.classes('text-green-500')
                # Optionally navigate to login after a delay
            else:
                status.set_text('Erro ao criar conta. Usuário já existe?')

        ui.button('Registrar', on_click=register).classes('w-full bg-green-500 text-white')
        ui.link('Já tem conta? Entrar', '/').classes('text-center block mt-2 text-sm text-blue-600')
