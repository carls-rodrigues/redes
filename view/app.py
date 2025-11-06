from nicegui import ui
from view.login_view import login_screen
from view.register_view import register_screen
from view.chat_dashboard_view import dashboard_screen
from view.chat_room_view import chat_room_screen
from view.group_view import group_screen

ui.page('/')(login_screen)
ui.page('/register')(register_screen)
ui.page('/dashboard')(dashboard_screen)
ui.page('/chat/{chat_id}')(chat_room_screen)
ui.page('/groups')(group_screen)

if __name__ == '__main__':
    ui.run(title='RedES Chat', port=8080)
