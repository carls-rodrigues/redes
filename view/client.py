import socket, json

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 5000))

# Login first
login_data = {"type": "login", "username": "cerfdotdev", "password": "password123"}
s.sendall(json.dumps(login_data).encode())
print(s.recv(4096).decode())

# Then send a message
msg = {"type": "message", "content": "It worked", "recipient_id": "793f7662-5eed-4f18-964b-6146285a8fb9"}
s.sendall(json.dumps(msg).encode())
