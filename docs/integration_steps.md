# UI-Backend Integration Documentation

This document outlines the steps taken to integrate the NiceGUI frontend with the Python socket-based backend for the RedES chat application.

## Overview

The application consists of:
- **Frontend**: NiceGUI web interface running on port 8080
- **Backend**: Custom socket server running on port 5000
- **Communication**: JSON messages over TCP sockets

## Integration Steps

### 1. Created Socket Client (`utils/socket_client.py`)

A `SocketClient` class was implemented to handle communication between the UI and backend:

- **Connection Management**: Connect/disconnect from the socket server
- **Message Sending**: Send JSON messages and wait for responses
- **Authentication Methods**: `login()` and `register()` methods
- **Chat Messaging**: `send_chat_message()` method for sending messages to chats/groups/users
- **Threading**: Uses background threads for non-blocking socket operations

Key features:
- Thread-safe message sending and receiving
- Automatic JSON serialization/deserialization
- Connection state management
- Error handling for network issues

### 2. Updated Authentication Views

#### Login Screen (`view/login_view.py`)
- Integrated with `SocketClient.login()`
- Validates credentials against backend
- Shows appropriate error messages
- Navigates to dashboard on successful login

#### Registration Screen (`view/register_view.py`)
- Integrated with `SocketClient.register()`
- Creates new user accounts via backend
- Provides feedback on registration success/failure

### 3. Updated Chat Functionality

#### Chat Room (`view/chat_room_view.py`)
- Integrated message sending with `SocketClient.send_chat_message()`
- Sends messages to specific chat IDs
- Displays sent messages in the UI
- Error handling for failed message sends

### 4. Backend Modifications

#### Server Updates (`controller/server.py`)
- Modified login response to include `user_id` in JSON response
- Ensures client receives user ID after successful authentication

## Data Types

All IDs in the system are UUID strings, not integers:
- User IDs
- Chat session IDs  
- Group IDs
- Message IDs

This is important when handling URL parameters and database queries.

## API Message Formats

### Authentication Messages

**Login Request:**
```json
{
  "type": "login",
  "username": "string",
  "password": "string"
}
```

**Login Response:**
```json
{
  "status": "ok",
  "user_id": "uuid-string"
}
```

**Registration Request:**
```json
{
  "type": "register",
  "username": "string",
  "password": "string"
}
```

**Registration Response:**
```json
{
  "status": "registered"
}
```

### Chat Messages

**Send Message Request:**
```json
{
  "type": "message",
  "content": "string",
  "chat_id": "uuid-string",
  "group_id": "uuid-string",
  "recipient_id": "uuid-string"
}
```

**Incoming Message:**
```json
{
  "chat_id": "uuid-string",
  "sender_id": "uuid-string",
  "content": "string",
  "timestamp": "2023-..."
}
```

## Running the Application

1. **Start Backend:**
   ```bash
   python main.py
   ```
   This starts both the socket server (port 5000) and NiceGUI frontend (port 8080).

2. **Access Application:**
   - Open browser to `http://localhost:8080`
   - Register a new account or login with existing credentials
   - Navigate to dashboard and start chatting

## Current Limitations

1. **Real-time Message Receiving**: The current implementation sends messages but doesn't handle incoming real-time messages in the UI. This would require:
   - Setting up message handlers in the socket client
   - Using NiceGUI's reactive updates to refresh chat displays
   - Filtering messages by chat_id for relevant updates

2. **Group Management**: Group creation and management views exist but are not fully integrated with backend services that handle group operations.

3. **Error Handling**: Basic error handling is implemented, but more robust error recovery and user feedback could be added.

4. **Connection Management**: The socket connection is established on-demand but doesn't handle reconnection on network failures.

## Future Enhancements

1. Implement real-time message receiving in chat views
2. Add group creation and management backend integration
3. Implement user presence/status indicators
4. Add message history loading from database
5. Enhance error handling and user feedback
6. Add connection retry logic and offline handling

## Dependencies

The integration uses the following key dependencies:
- `nicegui`: Web UI framework
- `socket`: Standard library for network communication
- `json`: Standard library for message serialization
- `threading`: Standard library for background socket operations
- `queue`: Standard library for thread-safe message passing