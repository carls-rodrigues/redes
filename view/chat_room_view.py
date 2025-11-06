from nicegui import ui, app
from view.components.chat import ChatRoomComponent

def chat_room_screen(chat_id: str = '1'):
    # --- 1️⃣ Load session from storage ---
    session = app.storage.user.get('session', {})
    if not session or not session.get('session_id'):
        ui.notify('Sessão expirada. Faça login novamente.')
        ui.navigate.to('/login')
        return

    # Prevent page scrolling and make chat fill viewport
    ui.add_css('body { overflow: hidden; margin: 0; padding: 0; }')

    # Create the chat room component in a full viewport container
    with ui.element('div').classes('fixed inset-0 overflow-hidden'):
        chat_room = ChatRoomComponent(
            chat_id=chat_id,
            session=session,
            on_back_click=lambda: ui.navigate.to('/')
        )

    # Load initial messages
    chat_room.load_messages()
