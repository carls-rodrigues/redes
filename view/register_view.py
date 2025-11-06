from nicegui import ui
from utils.socket_client import client
from design_tokens import Colors, Typography, Spacing, Shadows

def register_screen():
    with ui.card().classes('w-96 mx-auto mt-24 p-8 rounded-lg').style(
        f'background-color: {Colors.WHITE}; '
        f'box-shadow: {Shadows.MEDIUM}; '
        f'border: 1px solid {Colors.BORDER}; '
    ):
        ui.label('Registrar').classes('text-2xl font-bold text-center mb-6').style(
            f'color: {Colors.PRIMARY}; '
            f'font-family: {Typography.FONT_FAMILY}; '
        )
        
        username = ui.input('Usuário').props('outlined').classes('w-full mb-4').style(
            f'color: {Colors.DARK_GRAY}; '
        )
        password = ui.input('Senha', password=True).props('outlined').classes('w-full mb-4').style(
            f'color: {Colors.DARK_GRAY}; '
        )
        status = ui.label().classes('text-sm mb-4').style(
            f'color: {Colors.MEDIUM_GRAY}; '
        )

        def register():
            if not username.value or not password.value:
                status.set_text('Todos os campos são obrigatórios!')
                status.style(f'color: #EF4444;')
                return

            # Connect to server if not connected
            if not client.connected:
                if not client.connect():
                    status.set_text('Erro ao conectar ao servidor!')
                    status.style(f'color: #EF4444;')
                    return

            # Attempt registration
            if client.register(username.value, password.value):
                status.set_text('Conta criada com sucesso! Faça login.')
                status.style(f'color: #10B981;')
                # Optionally navigate to login after a delay
            else:
                status.set_text('Erro ao criar conta. Usuário já existe?')
                status.style(f'color: #EF4444;')

        ui.button('Registrar', on_click=register).classes('w-full text-white font-semibold py-2 rounded-lg').style(
            f'background-color: {Colors.PRIMARY}; '
            f'transition: opacity 150ms ease-in-out; '
        )
        
        ui.link('Já tem conta? Entrar', '/').classes('text-center block mt-4 text-sm font-medium').style(
            f'color: {Colors.PRIMARY}; '
            f'text-decoration: none; '
        )
