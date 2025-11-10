"use client";

import { useWebSocket } from "@/lib/websocket-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WebSocketTestPage() {
  const { sendMessage, lastMessage, isConnected, error } = useWebSocket();

  const testConnection = () => {
    console.log('Testando conexão WebSocket...');
    sendMessage({
      type: 'ping',
      message: 'test connection'
    });
  };

  const testLogin = () => {
    console.log('Testando login...');
    sendMessage({
      type: 'login',
      username: 'testuser',
      password: 'testpass'
    });
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>WebSocket Connection Test</CardTitle>
          <CardDescription>
            Test your WebSocket connection to the server on port 5000
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="space-x-2">
            <Button onClick={testConnection} disabled={!isConnected}>
              Test Connection (Ping)
            </Button>
            <Button onClick={testLogin} disabled={!isConnected}>
              Test Login
            </Button>
          </div>

          {lastMessage && (
            <div className="p-4 bg-gray-50 border rounded">
              <p className="font-medium">Last Message:</p>
              <pre className="text-sm mt-2 overflow-auto">
                {JSON.stringify(lastMessage, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>WebSocket URL:</strong> ws://localhost:5000/ws</p>
            <p><strong>Check browser console for detailed logs</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}