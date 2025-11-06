from nicegui import ui, app
from utils.socket_client import client

def chat_room_screen(chat_id: str = '1'):

    # --- 1️⃣ Load session from storage ---
    session = app.storage.user.get('session', {})
    if not session or not session.get('session_id'):
        ui.notify('Sessão expirada. Faça login novamente.')
        ui.navigate.to('/login')
        return

    username = session.get('username')
    user_id = session.get('user_id')

    # Track loaded message IDs to prevent duplicates
    loaded_message_ids = set()

    # --- 2️⃣ Header ---
    with ui.row().classes('justify-between items-center p-4 bg-gray-100 w-full'):
        ui.label(f'Chat de {username}').classes('text-xl font-semibold')
        ui.button('Voltar', on_click=lambda: ui.navigate.to('/')).props('outline round dense')

    ui.separator()

    # --- 3️⃣ Message area ---
    message_area = ui.column().classes('w-full flex-grow p-4 h-[70vh] overflow-y-auto bg-white rounded-lg shadow-inner message-container')

    # --- 4️⃣ Fetch chat messages via socket ---
    def load_messages():
        if not client.connected:
            client.connect()
        response = client.send_message({
            "type": "get_messages",
            "chat_id": chat_id,
            "session": session
        })

        if not response or response.get("status") != "ok":
            ui.notify("Erro ao carregar mensagens", type="negative")
            return

        messages = response.get("messages", [])
        has_new_messages = False
        
        # Only add new messages that we haven't seen before
        for msg in messages:
            msg_id = msg.get("id")
            if msg_id and msg_id not in loaded_message_ids:
                loaded_message_ids.add(msg_id)
                has_new_messages = True
                sent = str(msg["sender_id"]) == str(user_id)
                name = "Você" if sent else msg.get("sender_username", "Unknown")
                text = msg["content"]
                with message_area:
                    if sent:
                        with ui.row().classes('w-full justify-end mb-2'):
                            with ui.column().classes('items-end'):
                                ui.label(name).classes('text-xs text-gray-500')
                                ui.label(text).classes('bg-blue-500 text-white p-2 rounded-lg max-w-xs break-words')
                    else:
                        with ui.row().classes('w-full justify-start mb-2'):
                            with ui.column().classes('items-start'):
                                ui.label(name).classes('text-xs text-gray-500')
                                ui.label(text).classes('bg-gray-200 p-2 rounded-lg max-w-xs break-words')
        
        # Scroll to bottom if new messages were added
        if has_new_messages:
            ui.run_javascript('setTimeout(() => { const el = document.querySelector(".message-container"); if (el) el.scrollTop = el.scrollHeight; }, 100);')

    def handle_incoming(msg):
        if str(msg.get("chat_id")) == str(chat_id):
            msg_data = msg.get("message", {})
            msg_id = msg_data.get("id")
            if msg_id and msg_id not in loaded_message_ids:
                loaded_message_ids.add(msg_id)
                sent = str(msg_data.get("sender_id")) == str(user_id)
                name = "Você" if sent else msg_data.get("sender_username", "Unknown")
                text = msg_data.get("content", "")
                with message_area:
                    if sent:
                        with ui.row().classes('w-full justify-end mb-2'):
                            with ui.column().classes('items-end'):
                                ui.label(name).classes('text-xs text-gray-500')
                                ui.label(text).classes('bg-blue-500 text-white p-2 rounded-lg max-w-xs break-words')
                    else:
                        with ui.row().classes('w-full justify-start mb-2'):
                            with ui.column().classes('items-start'):
                                ui.label(name).classes('text-xs text-gray-500')
                                ui.label(text).classes('bg-gray-200 p-2 rounded-lg max-w-xs break-words')
                # Scroll to bottom
                ui.run_javascript('setTimeout(() => { const el = document.querySelector(".message-container"); if (el) el.scrollTop = el.scrollHeight; }, 100);')

    # Initial load
    load_messages()

    # Scroll to bottom after loading messages
    ui.run_javascript('setTimeout(() => { const el = document.querySelector(".message-container"); if (el) el.scrollTop = el.scrollHeight; }, 100);')

    # Set up real-time message handler
    if client.connected:
        client.set_incoming_handler(handle_incoming)

    # Check for incoming messages frequently
    ui.timer(0.1, lambda: check_incoming_messages())

    def check_incoming_messages():
        while not client.incoming_queue.empty():
            msg = client.incoming_queue.get()
            handle_incoming(msg)

    # --- 5️⃣ Send message handler ---
    def send_message(content: str):
        if not content.strip():
            return

        if not client.connected:
            client.connect()

        msg_data = {
            "type": "message",
            "chat_id": chat_id,
            "content": content,
            "session": session
        }

        response = client.send_message(msg_data)
        if response and response.get("status") == "ok":
            # Add the message ID to our tracking set
            msg_id = response.get("message_id")
            if msg_id:
                loaded_message_ids.add(msg_id)
            
            # Add message to UI
            with message_area:
                with ui.row().classes('w-full justify-end mb-2'):
                    with ui.column().classes('items-end'):
                        ui.label("Você").classes('text-xs text-gray-500')
                        ui.label(content).classes('bg-blue-500 text-white p-2 rounded-lg max-w-xs break-words')
            message_input.value = ""
            # Scroll to bottom after sending
            ui.run_javascript('setTimeout(() => { const el = document.querySelector(".message-container"); if (el) el.scrollTop = el.scrollHeight; }, 100);')
        else:
            ui.notify("Erro ao enviar mensagem", type="negative")

    # --- 6️⃣ Input area ---
    with ui.row().classes("w-full p-4 bg-gray-50 rounded-b-lg"):
        message_input = ui.input("Digite sua mensagem...").props("outlined").classes("flex-grow")
        message_input.on('keydown.enter', lambda: send_message(message_input.value))
        ui.button("Enviar", on_click=lambda: send_message(message_input.value)).classes("bg-blue-500 text-white")

    # --- 7️⃣ No more periodic refresh, updates only on new messages ---
