from nicegui import ui, app
from utils.socket_client import client

def dashboard_screen():
    session = app.storage.user.get('session', {})
    # Validate session
    if not session or not session.get('session_id'):
        ui.navigate.to('/login')
        return

    user_id = session.get('user_id')
    username = session.get('username')
    
    with ui.row().classes('justify-between items-center mt-4 mx-4'):
        ui.label(f'Seus Chats - {username}').classes('text-2xl font-bold')
        with ui.row():
            ui.button('Criar Grupo', on_click=lambda: ui.navigate.to(f'/groups?session={session}')).classes('bg-blue-500 text-white mr-2')
            ui.button('Sair', on_click=lambda: logout()).classes('bg-red-500 text-white')

    ui.separator().classes('my-2')

    # Container for chat list
    chat_container = ui.column().classes('mx-4 space-y-2')
    
    def load_chats():
        """Load and display user chats"""
        chat_container.clear()
        
        if not user_id:
            with chat_container:
                ui.label('Erro: Sessão inválida.').classes('text-red-500')
            return
        
        # Ensure connection
        if not client.connected:
            client.connect()
        
        # Get user's chats dynamically via socket
        user_chats = client.get_user_chats(session=session)

        with chat_container:
            if user_chats:
                for chat in user_chats:
                    with ui.card().classes('p-3 w-full cursor-pointer hover:bg-gray-100').on('click', lambda c=chat: ui.navigate.to(f'/chat/{c["id"]}')):
                        ui.label(chat['name']).classes('text-lg')
                        ui.label(f'Última mensagem: {chat["last_message"]}').classes('text-sm text-gray-500')
            else:
                ui.label('Nenhum chat encontrado. Inicie uma conversa!').classes('text-gray-500')
    
    # Initial load
    load_chats()

def logout():
    app.storage.user.pop('session', None)
    ui.navigate.to('/')
