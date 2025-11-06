from nicegui import ui, app
from utils.socket_client import client
from design_tokens import Colors, Typography, Spacing, Shadows


def login_screen():
    session = app.storage.user.get('session', {})
    if session and session.get('session_id'):
        ui.navigate.to('/')
        return

    with ui.card().classes('w-96 mx-auto mt-24 p-8 rounded-lg').style(
        f'background-color: {Colors.WHITE}; '
        f'box-shadow: {Shadows.MEDIUM}; '
        f'border: 1px solid {Colors.BORDER}; '
    ):
        ui.label('Login').classes('text-2xl font-bold text-center mb-6').style(
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

        def login():
            if not username.value or not password.value:
                status.set_text('Preencha todos os campos!')
                status.style(f'color: #EF4444;')
                return

            # Connect to server if not connected
            if not client.connected:
                if not client.connect():
                    status.set_text('Erro ao conectar ao servidor!')
                    status.style(f'color: #EF4444;')
                    return

            # Attempt login
            result = client.login(username.value, password.value)
            if result and result.get("session_id"):
                app.storage.user['session'] = result
                ui.navigate.to(f'/')
            else:
                status.set_text('Credenciais inválidas!')
                status.style(f'color: #EF4444;')

        ui.button('Entrar', on_click=login).classes('w-full text-white font-semibold py-2 rounded-lg').style(
            f'background-color: {Colors.PRIMARY}; '
            f'transition: opacity 150ms ease-in-out; '
        ).on('mouseenter', lambda: None).on('mouseleave', lambda: None)
        
        ui.link('Criar conta', '/register').classes('text-center block mt-4 text-sm font-medium').style(
            f'color: {Colors.PRIMARY}; '
            f'text-decoration: none; '
        )
