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

connections = {}  # user_id -> socket

def handle_client(sock, addr):
    user_id = None
    try:
        while True:
            data = sock.recv(4096)
            if not data:
                break
            msg = json.loads(data.decode())

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

            # 2️⃣ Require authentication for other actions
            if not user_id:
                sock.sendall(b'{"status":"error","message":"not authenticated"}')
                break

            print(f"[{user_id}] Message received: {msg}")
            # 3️⃣ Handle sending message
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
    server.bind((HOST, PORT))
    server.listen()
    print(f"💬 Chat socket server running on {HOST}:{PORT}")

    while True:
        conn, addr = server.accept()
        threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()

