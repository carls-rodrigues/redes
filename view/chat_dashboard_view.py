from nicegui import ui, app
from utils.socket_client import client
from design_tokens import Colors, Typography, Spacing, BorderRadius, Shadows, Components

def logout():
    """Logout user and navigate to login"""
    app.storage.user.pop('session', None)
    ui.navigate.to('/')

def dashboard_screen():
    session = app.storage.user.get('session', {})
    # Validate session
    if not session or not session.get('session_id'):
        ui.navigate.to('/login')
        return

    user_id = session.get('user_id')
    username = session.get('username')
    
    # ========================================================================
    # 3-COLUMN LAYOUT: Sidebar | Conversation List | Main Area
    # ========================================================================
    
    with ui.row().classes('w-full h-full flex'):
        # ====================================================================
        # COLUMN 1: LEFT SIDEBAR (60-70px) - Icon Navigation
        # ====================================================================
        with ui.column().classes('w-16 bg-blue-500 flex flex-col items-center py-4 gap-4 border-r border-gray-200').style('width: 60px; background-color: #3B4FE4;'):
            # Home icon/button
            ui.button(icon='home', on_click=lambda: None).props('flat round dense').classes('text-white')
            
            # Chat icon
            ui.button(icon='chat', on_click=lambda: None).props('flat round dense').classes('text-white')
            
            # Groups icon
            ui.button(icon='group', on_click=lambda: ui.navigate.to(f'/groups?session={session}')).props('flat round dense').classes('text-white')
            
            # Settings icon
            ui.button(icon='settings', on_click=lambda: None).props('flat round dense').classes('text-white')
            
            ui.space()
            
            # Logout at bottom
            ui.button(icon='logout', on_click=logout).props('flat round dense').classes('text-white')
        
        # ====================================================================
        # COLUMN 2: CONVERSATION LIST (280-320px) - List of Chats
        # ====================================================================
        with ui.column().classes('w-80 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden').style('width: 280px; background-color: #F5F5F7;'):
            # Header section with title and create button
            with ui.row().classes('items-center justify-between p-4 bg-white border-b border-gray-200'):
                ui.label('Conversas').classes('text-lg font-semibold text-gray-900')
                ui.button(icon='add', on_click=lambda: ui.navigate.to(f'/groups?session={session}')).props('flat round dense').classes('text-blue-500')
            
            # Scrollable conversation list
            chat_container = ui.column().classes('w-full flex-grow overflow-y-auto px-2 py-2 space-y-1')
            
            def load_chats():
                """Load and display user chats"""
                chat_container.clear()
                
                if not user_id:
                    with chat_container:
                        ui.label('Erro: Sessão inválida.').classes('text-red-500 text-center py-4')
                    return
                
                # Ensure connection
                if not client.connected:
                    client.connect()
                
                # Get user's chats dynamically via socket
                user_chats = client.get_user_chats(session=session)

                with chat_container:
                    if user_chats:
                        for chat in user_chats:
                            # Conversation card
                            with ui.element('div').classes('p-3 rounded-lg cursor-pointer hover:bg-white transition-colors').on('click', lambda c=chat: ui.navigate.to(f'/chat/{c["id"]}')):
                                # Chat name
                                ui.label(chat['name']).classes('text-sm font-medium text-gray-900 truncate')
                                
                                # Last message preview
                                ui.label(chat.get('last_message', 'Sem mensagens')).classes('text-xs text-gray-500 truncate mt-1')
                    else:
                        ui.label('Nenhuma conversa').classes('text-center text-gray-500 py-8 text-sm')
            
            # Initial load
            load_chats()
        
        # ====================================================================
        # COLUMN 3: MAIN AREA (Flexible) - Welcome/Empty State or Chat View
        # ====================================================================
        with ui.column().classes('flex-grow bg-white flex flex-col items-center justify-center'):
            # Empty state - show welcome message
            ui.label('Selecione uma conversa para começar').classes('text-gray-500 text-lg')
            ui.label(f'Bem-vindo, {username}!').classes('text-2xl font-bold text-gray-900 mt-4')
            
            with ui.row().classes('gap-4 mt-8'):
                ui.button('+ Nova Conversa', on_click=lambda: ui.navigate.to(f'/groups?session={session}')).classes('bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600')
                ui.button('Sair', on_click=logout).classes('bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600')
