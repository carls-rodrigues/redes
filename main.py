import asyncio
import threading
from controller import server  # your socket backend
from nicegui import ui, app
from view.login_view import login_screen
from view.register_view import register_screen
from view.chat_dashboard_split_view import dashboard_screen
from view.chat_room_view import chat_room_screen
from view.group_view import group_screen
from utils.socket_client import client
from design_tokens import Colors

# ============================================================================
# GLOBAL DESIGN SYSTEM CSS - Applied once before page registration
# ============================================================================

GLOBAL_CSS = f"""
* {{
    box-sizing: border-box;
}}

body {{
    margin: 0;
    padding: 0;
    background-color: {Colors.LIGHT_GRAY};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: {Colors.DARK_GRAY};
}}

/* Scrollbar styling */
::-webkit-scrollbar {{
    width: 8px;
    height: 8px;
}}

::-webkit-scrollbar-track {{
    background: {Colors.LIGHT_GRAY};
}}

::-webkit-scrollbar-thumb {{
    background: {Colors.MEDIUM_GRAY};
    border-radius: 4px;
}}

::-webkit-scrollbar-thumb:hover {{
    background: {Colors.PRIMARY};
}}

/* Input styling */
input {{
    font-family: inherit;
    color: {Colors.DARK_GRAY};
}}

input::placeholder {{
    color: {Colors.MEDIUM_GRAY};
}}

/* Button reset */
button {{
    font-family: inherit;
    border: none;
    cursor: pointer;
}}

/* Link styling */
a {{
    color: {Colors.PRIMARY};
    text-decoration: none;
    transition: opacity 150ms ease-in-out;
}}

a:hover {{
    opacity: 0.8;
}}
"""

# ============================================================================
# BACKGROUND SERVICES
# ============================================================================

def run_socket_server():
    print("⚙️ Starting socket server...")
    server.start_server()

# Run socket server in background
socket_thread = threading.Thread(target=run_socket_server, daemon=True)
socket_thread.start()

# ============================================================================
# PAGE DEFINITIONS - All UI inside page functions (NiceGUI v3+ requirement)
# ============================================================================

@ui.page('/login')
def login_page():
    """Login page"""
    # Apply global CSS only once
    ui.add_css(GLOBAL_CSS)
    login_screen()

@ui.page('/register')
def register_page():
    """Registration page"""
    register_screen()

@ui.page('/')
def home_page(chat: str = None):
    """Chat dashboard - home page"""
    dashboard_screen(chat)

@ui.page('/chat/{chat_id}')
def chat_page(chat_id: str = '1'):
    """Individual chat room"""
    chat_room_screen(chat_id)

@ui.page('/groups')
def groups_page():
    """Group management page"""
    group_screen()

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ in {"__main__", "__mp_main__"}:
    print("🌐 Starting NiceGUI frontend...")
    print("📐 Design system loaded - RedES Chat with modern, clean interface")
    ui.run(title='RedES Chat', port=8080, storage_secret='super_secret_no_tell')
