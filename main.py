import threading
from controller import server  # your socket backend
from nicegui import ui
from view.login_view import login_screen
from view.register_view import register_screen
from view.chat_dashboard_view import dashboard_screen
from view.chat_room_view import chat_room_screen
from view.group_view import group_screen

def run_socket_server():
    print("⚙️ Starting socket server...")
    server.start_server()

# Run socket server in background
socket_thread = threading.Thread(target=run_socket_server, daemon=True)
socket_thread.start()

# Register GUI pages
ui.page('/')(login_screen)
ui.page('/register')(register_screen)
ui.page('/dashboard')(dashboard_screen)
ui.page('/chat/{chat_id}')(chat_room_screen)
ui.page('/groups')(group_screen)

# Start NiceGUI frontend
if __name__ in {"__main__", "__mp_main__"}:
    print("🌐 Starting NiceGUI frontend...")
    ui.run(title='RedES Chat', port=8080)
