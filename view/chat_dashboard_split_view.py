"""
Chat Dashboard with split-screen layout (like WhatsApp)
Three columns: Navigation Sidebar | Conversation List | Chat Area
"""
from nicegui import ui, app
from view.components.chat import ChatRoomComponent
from utils.socket_client import client


def dashboard_screen(chat: str = None):
    """Main dashboard with 3-column layout: sidebar | conversation list | chat"""
    session = app.storage.user.get('session', {})
    
    # Validate session
    if not session or not session.get('session_id'):
        ui.navigate.to('/login')
        return

    user_id = session.get('user_id')
    username = session.get('username')
    
    # Ensure the socket client is connected
    if not client.connected:
        client.connect()
    
    # ====================================================================
    # GLOBAL CHAT CARD MAP - for updating chat cards when messages arrive
    # ====================================================================
    chat_card_map = {}  # Map chat_id to card info (element, label)
    
    # Global handler to update ALL chat cards when messages arrive
    def global_incoming_message_handler(msg: dict):
        """Handle incoming messages and update chat card for that chat"""
        chat_id = msg.get("chat_id")
        message_data = msg.get("message", {})
        last_message = message_data.get("content", "")
        
        if chat_id and chat_id in chat_card_map:
            try:
                card_info = chat_card_map[chat_id]
                label_element = card_info['last_message_label']
                label_element.set_text(last_message)
            except Exception as e:
                pass
    
    # Register the global handler EARLY
    client.add_incoming_handler(global_incoming_message_handler)
    
    # State management
    state = {
        'selected_chat': None,
        'chat_component': None,
        'auto_select_chat_id': chat
    }
    
    # ========================================================================
    # MAIN LAYOUT - 3 COLUMNS
    # ========================================================================
    
    ui.query('.nicegui-content').style('padding: 0; margin: 0;')
    with ui.row().classes('w-screen h-screen m-0 p-0 overflow-hidden bg-white'):
        
        # ====================================================================
        # COLUMN 1: NAVIGATION SIDEBAR (60px, primary blue)
        # ====================================================================
        with ui.column().classes('w-16 h-screen bg-blue-600 flex flex-col items-center py-4 space-y-4 flex-shrink-0'):
            # Logo/App icon
            ui.icon('chat').classes('text-3xl text-white')
            ui.separator().classes('w-8 my-4 bg-blue-400')
            
            # Navigation icons
            ui.button(icon='home', on_click=lambda: None).props('flat unelevated').classes('text-white w-12 h-12 hover:bg-blue-500')
            ui.button(icon='person', on_click=lambda: None).props('flat unelevated').classes('text-white w-12 h-12 hover:bg-blue-500')
            ui.button(icon='settings', on_click=lambda: None).props('flat unelevated').classes('text-white w-12 h-12 hover:bg-blue-500')
            
            ui.space()
            
            # Logout button
            ui.button(icon='logout', on_click=lambda: logout()).props('flat unelevated').classes('text-white w-12 h-12 hover:bg-red-500')
        
        # ====================================================================
        # COLUMN 2: CONVERSATION LIST (280px, light gray background)
        # ====================================================================
        with ui.column().classes('w-72 h-screen bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0'):
            # Header
            with ui.row().classes('p-4 border-b border-gray-200 items-center justify-between'):
                ui.label('Chats').classes('text-lg font-bold text-gray-900')
                ui.button(icon='add', on_click=lambda: ui.navigate.to('/groups')).props('flat dense').classes('text-gray-600 hover:text-gray-900')
            
            # Chat list container
            with ui.column().classes('flex-grow overflow-y-auto w-full') as chat_list_container:
                chat_cards = []
        
        # ====================================================================
        # COLUMN 3: CHAT AREA (flexible, white background)
        # ====================================================================
        with ui.column().classes('flex-grow h-screen bg-white flex flex-col'):
            # Main container - will hold either welcome message or chat
            chat_area_container = ui.column().classes('flex-grow overflow-hidden w-full h-full')
            
            def show_welcome_message():
                """Display welcome message when no chat is selected"""
                chat_area_container.clear()
                with chat_area_container:
                    with ui.column().classes('h-full w-full flex flex-col items-center justify-center text-center gap-6'):
                        # Welcome icon
                        ui.icon('waving_hand').classes('text-8xl text-blue-300')
                        
                        # Welcome title
                        ui.label(f'Bem-vindo, {username}!').classes('text-4xl font-bold text-gray-900')
                        
                        # Welcome message
                        ui.label('Selecione uma conversa para começar a conversar').classes('text-xl text-gray-500')
                        
                        # Divider
                        ui.separator().classes('w-32')
                        
                        # Create new chat button
                        ui.button(
                            icon='add_circle_outline',
                            text='Criar Novo Chat',
                            on_click=lambda: ui.navigate.to('/groups')
                        ).classes('bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors')
            
            def load_chat_view(chat_data):
                """Load chat view into the main area"""
                chat_area_container.clear()
                
                # Create a callback to update the chat card when messages are sent
                def on_message_sent(new_last_message: str):
                    """Update the chat card with the new last message"""
                    chat_data['last_message'] = new_last_message
                    # Update the label in the chat card if it exists in the map
                    if chat_data['id'] in chat_card_map:
                        card_info = chat_card_map[chat_data['id']]
                        card_info['last_message_label'].set_text(new_last_message)
                    # Enable polling to detect receiver's messages
                    enable_polling()
                
                # Create a callback to update the chat card when messages are received
                def on_message_received(new_last_message: str):
                    """Update the chat card with the new last message received"""
                    chat_data['last_message'] = new_last_message
                    # Update the label in the chat card if it exists in the map
                    if chat_data['id'] in chat_card_map:
                        card_info = chat_card_map[chat_data['id']]
                        card_info['last_message_label'].set_text(new_last_message)
                
                # Create and render the chat room component
                with chat_area_container:
                    chat_room = ChatRoomComponent(
                        chat_id=chat_data['id'],
                        session=session,
                        on_back_click=lambda: None,  # No back button in split view
                        on_message_sent=on_message_sent,  # Pass the callback
                        on_message_received=on_message_received  # Pass the callback for received messages
                    )
                    chat_room.load_messages()
            
            # Show welcome message initially
            show_welcome_message()
            
            # Footer with user info
            with ui.row().classes('p-4 border-t border-gray-200 bg-gray-50 items-center justify-between flex-shrink-0'):
                with ui.row().classes('items-center gap-3'):
                    ui.icon('account_circle').classes('text-2xl text-gray-600')
                    with ui.column().classes('gap-0'):
                        ui.label(username).classes('text-sm font-semibold text-gray-900')
                        ui.label('Online').classes('text-xs text-green-600 font-medium')
                
                ui.button(icon='info', on_click=lambda: ui.notify('RedES Chat v1.0')).props('flat dense').classes('text-gray-600 hover:text-gray-900')
        
        # ====================================================================
        # LOAD CHATS (defined after all containers and functions are ready)
        # ====================================================================
        def load_chats():
            """Load and display user chats"""
            chat_list_container.clear()
            chat_cards.clear()
            chat_card_map.clear()
            
            if not user_id:
                with chat_list_container:
                    ui.label('Erro: Sessão inválida.').classes('text-red-500 p-4')
                return
            
            # Ensure connection
            if not client.connected:
                client.connect()
            
            # Get user's chats
            user_chats = client.get_user_chats(session=session)

            with chat_list_container:
                if user_chats:
                    for chat in user_chats:
                        # Create card for each chat
                        def create_chat_card(chat_data):
                            def on_select_chat():
                                state['selected_chat'] = chat_data
                                # Update URL with chat ID without page reload
                                chat_id = chat_data["id"]
                                ui.run_javascript(f"window.history.replaceState(null, '', '/?chat={chat_id}')")
                                # Remove previous selection highlight
                                for card in chat_cards:
                                    card.classes(remove='bg-white border-l-4 border-blue-500', add='bg-white hover:bg-gray-100')
                                
                                # Highlight selected card
                                card_element.classes(remove='bg-white hover:bg-gray-100', add='bg-white border-l-4 border-blue-500')
                                
                                # Load or update chat in right panel
                                load_chat_view(chat_data)
                            
                            with ui.card().classes('w-full bg-white p-0 m-0 rounded-none border-0 border-b border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors').style('box-shadow: none;') as card_element:
                                card_element.on('click', on_select_chat)
                                
                                with ui.column().classes('p-3 w-full'):
                                    ui.label(chat_data['name']).classes('text-sm font-semibold text-gray-900')
                                    last_message_label = ui.label(chat_data['last_message']).classes('text-xs text-gray-500 truncate mt-1')
                                
                                chat_cards.append(card_element)
                                
                                # Store reference to card and last message label for updates
                                chat_card_map[chat_data['id']] = {
                                    'card': card_element,
                                    'last_message_label': last_message_label
                                }
                                
                                # Auto-select if this chat ID matches the query parameter
                                if state['auto_select_chat_id'] and str(chat_data['id']) == str(state['auto_select_chat_id']):
                                    # Don't use timer, just call directly
                                    on_select_chat()
                            
                            return card_element
                        
                        create_chat_card(chat)
                else:
                    ui.label('Nenhum chat encontrado').classes('text-gray-500 p-4 text-center')
        
        # Initial load
        load_chats()
        
        # Poll for chat updates - keep polling but check efficiently
        def poll_chats():
            """Periodically refresh chat list to get latest messages"""
            if not user_id:
                return
            
            try:
                user_chats = client.get_user_chats(session=session)
                if user_chats:
                    for chat in user_chats:
                        chat_id = chat['id']
                        if chat_id in chat_card_map:
                            # Update the last message text
                            card_info = chat_card_map[chat_id]
                            try:
                                card_info['last_message_label'].set_text(chat['last_message'])
                            except Exception as e:
                                pass
            except Exception as e:
                pass
        
        # Poll every 1 second for updates
        ui.timer(1.0, poll_chats)


def logout():
    """Logout user"""
    app.storage.user.pop('session', None)
    ui.navigate.to('/login')
