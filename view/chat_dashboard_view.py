from fastapi import Request
from nicegui import ui
from services import MessageService


def dashboard_screen(request: Request):
    session_id = request.cookies.get('session_id')
    print(session_id)
    # Validate session
    # if not session or not session_manager.get_session(session):
    #     ui.navigate.to('/')
    #     return

    user_id = None
    username = None
    session = None

    with ui.row().classes('justify-between items-center mt-4 mx-4'):
        ui.label(f'Seus Chats - {username}').classes('text-2xl font-bold')
        with ui.row():
            ui.button('Criar Grupo', on_click=lambda: ui.navigate.to(f'/groups?session={session}')).classes('bg-blue-500 text-white mr-2')
            ui.button('Sair', on_click=lambda: logout(session)).classes('bg-red-500 text-white')

    ui.separator().classes('my-2')

    with ui.column().classes('mx-4 space-y-2'):
        if user_id:
            # Get user's chats dynamically
            message_service = MessageService()
            user_chats = message_service.get_user_chats(user_id)

            if user_chats:
                for chat in user_chats:
                    with ui.card().classes('p-3 w-full cursor-pointer hover:bg-gray-100').on('click', lambda chat_id=chat['id']: ui.navigate.to(f'/chat/{chat_id}?session={session}')):
                        ui.label(chat['name']).classes('text-lg')
                        ui.label(f'Última mensagem: {chat["last_message"]}').classes('text-sm text-gray-500')
            else:
                ui.label('Nenhum chat encontrado. Inicie uma conversa!').classes('text-gray-500')
        else:
            ui.label('Erro: Sessão inválida.').classes('text-red-500')

def logout(session: str):
    """Clear session and redirect to login"""
    # session_manager.delete_session(session)
    ui.navigate.to('/')
