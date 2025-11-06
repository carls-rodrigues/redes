from nicegui import ui
from utils.socket_client import client
from utils.session import SessionManager

session_manager = SessionManager()

def login_screen():
    with ui.card().classes('w-96 mx-auto mt-24 p-6 shadow-lg rounded-xl'):
        ui.label('Login').classes('text-2xl font-bold mb-4 text-center')
        username = ui.input('Usuário').props('outlined').classes('mb-2 w-full rounded-sm')
        password = ui.input('Senha', password=True).props('outlined').classes('mb-4 w-full rounded-sm')
        status = ui.label().classes('text-red-500 text-sm mb-2')

        def login():
            if not username.value or not password.value:
                status.set_text('Preencha todos os campos!')
                return

            # Connect to server if not connected
            if not client.connected:
                if not client.connect():
                    status.set_text('Erro ao conectar ao servidor!')
                    return

            # Attempt login
            user_id = client.login(username.value, password.value)
            if user_id:
                # Create session for this client
                session_id = session_manager.create_session(user_id, username.value)
                # Store session in cookie using JavaScript
                ui.run_javascript(f'''
                    document.cookie = "session_id={session_id}; path=/; max-age=86400; SameSite=Lax";
                    console.log("Session cookie set:", "{session_id}");
                ''')
                # Navigate to dashboard
                ui.navigate.to('/dashboard')
            else:
                status.set_text('Credenciais inválidas!')

        ui.button('Entrar', on_click=login).classes('w-full bg-blue-500 text-white')
        ui.link('Criar conta', '/register').classes('text-center block mt-2 text-sm text-blue-600')
