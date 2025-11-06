from nicegui import ui
from utils.socket_client import client

def chat_room_screen(chat_id: str = '1', session: str = None):
    # Validate session
    # if not session or not session_manager.get_session(session):
    #     ui.navigate.to('/')
    #     return

    username = None

    with ui.row().classes('justify-between items-center p-4 bg-gray-100'):
        ui.label(f'Chat ID: {chat_id}').classes('text-xl font-semibold')
        ui.button('Voltar', on_click=lambda: ui.navigate.to(f'/dashboard?session={session}')).props('outline round dense')

    ui.separator()

    message_area = ui.column().classes('flex-grow p-4 h-[70vh] overflow-y-auto bg-white rounded-lg shadow-inner')
    with ui.row().classes('w-full p-4 bg-gray-50 rounded-b-lg'):
        message_input = ui.input('Digite sua mensagem...').props('outlined').classes('flex-grow')
        ui.button('Enviar', on_click=lambda: send_message(message_input.value, chat_id)).classes('bg-blue-500 text-white')

    def send_message(content: str, chat_id: str):
        if not content:
            return

        # Send message via socket
        if client.send_chat_message(content, chat_id=chat_id):
            with message_area:
                ui.chat_message(text=content, name=username or 'Você', sent=True)
            message_input.value = ''
        else:
            ui.notify('Erro ao enviar mensagem', type='negative')
