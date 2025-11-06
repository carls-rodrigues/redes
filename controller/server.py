import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import socket, threading, json
from services import MessageService, UsersService, AuthService
from database.db import Database
import sqlite3

HOST, PORT = '127.0.0.1', 5000

conn = sqlite3.connect("chat.db", check_same_thread=False)
database = Database(conn=conn)
users_service = UsersService(db=database)
msg_service = MessageService(db=database, usersService=users_service)
auth_service = AuthService(db=database)

connections = {}

def handle_client(sock, addr):
    user_id = None
    buffer = ""
    try:
        while True:
            data = sock.recv(4096)
            if not data:
                break
            
            # Accumulate data in buffer
            buffer += data.decode()
            
            # Try to parse complete JSON messages
            while buffer:
                try:
                    msg = json.loads(buffer)
                    buffer = ""  # Clear buffer on successful parse
                except json.JSONDecodeError:
                    # Incomplete JSON, wait for more data
                    break

                # 1️⃣ Handle login/register first
                if msg["type"] == "register":
                    user_id = auth_service.register(msg["username"], msg["password"])
                    sock.sendall(b'{"status":"registered"}')
                    continue

                if msg["type"] == "login":
                    session = auth_service.login(msg["username"], msg["password"])
                    user_id = session.user_id
                    if user_id:
                        connections[user_id] = sock
                        sock.sendall(json.dumps({
                            "status": "ok",
                            "user_id": user_id,
                            "username": session.username,
                            "session_id": session.session_id
                        }).encode())
                    else:
                        sock.sendall(b'{"status":"error","message":"invalid credentials"}')
                        break
                    continue

                # 2️⃣ Handle getting user chats (check session from message)
                if msg["type"] == "get_user_chats":
                    print('[get_user_chats] request received')
                    session = msg.get("session")
                    if not session:
                        sock.sendall(b'{"status":"error","message":"no session provided"}')
                        continue
                    request_user_id = session.get("user_id")
                    if not request_user_id:
                        sock.sendall(b'{"status":"error","message":"invalid user"}')
                        continue
                    
                    # Use the user_id from session for this request
                    chats = msg_service.get_user_chats(request_user_id)
                    response = json.dumps({
                        "status": "ok",
                        "chats": chats
                    })
                    print(f'[get_user_chats] sending response: {response}')
                    sock.sendall(response.encode())
                    continue

                # 3️⃣ Require authentication for other actions
                if not user_id:
                    sock.sendall(b'{"status":"error","message":"not authenticated"}')
                    break

                print(f"[{user_id}] Message received: {msg}")
                
                # 4️⃣ Handle sending message
                if msg["type"] == "message":
                    message = msg_service.send_message(
                        sender_id=user_id,
                        content=msg["content"],
                        chat_id=msg.get("chat_id"),
                        group_id=msg.get("group_id"),
                        recipient_id=msg.get("recipient_id")
                    )

                    # Broadcast to chat participants
                    chat = msg_service.db.get_chat_session(message.chat_id)
                    for p in chat.participants:
                        pid = p["id"]
                        if pid != user_id and pid in connections:
                            payload = json.dumps({
                                "chat_id": message.chat_id,
                                "sender_id": message.sender_id,
                                "content": message.content,
                                "timestamp": message.timestamp
                            })
                            connections[pid].sendall(payload.encode())

    except Exception as e:
        print(f"Error with {addr}: {e}")
    finally:
        if user_id and user_id in connections:
            del connections[user_id]
        sock.close()
        print(f"[-] Connection closed for {addr}")


def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen()
    print(f"💬 Chat socket server running on {HOST}:{PORT}")

    while True:
        conn, addr = server.accept()
        print(f"[+] New connection from {addr}")
        threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()

