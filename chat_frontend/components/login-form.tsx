"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useWebSocket } from "@/lib/websocket-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { sendMessage, lastMessage, isConnected, error: wsError, reconnect } = useWebSocket()
  const router = useRouter()

  const reconnectWebSocket = () => {
    console.log('Manually reconnecting WebSocket...');
    reconnect();
  };

  useEffect(() => {
    if (lastMessage) {
      console.log('Login form received message:', lastMessage);
      // Check for login response - either by type or by checking if it has user/session data
      if ((lastMessage.type === 'login' || (lastMessage.user && lastMessage.session)) && lastMessage.status === 'ok') {
        console.log('Login successful, redirecting to /');
        // Login successful
        localStorage.setItem('user', JSON.stringify(lastMessage.user));
        localStorage.setItem('session', JSON.stringify(lastMessage.session));
        setIsLoading(false);
        router.push('/');
      } else if ((lastMessage.type === 'login' || (lastMessage.user && lastMessage.session)) && lastMessage.status === 'error') {
        console.log('Login failed:', lastMessage.message);
        // Login failed
        setError(lastMessage.message || 'Login failed');
        setIsLoading(false);
      }
    }
  }, [lastMessage, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError('Please fill all fields');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    setIsLoading(true);

    console.log('Sending login request:', { username, password });
    const requestId = sendMessage({
      type: 'login',
      username: username,
      password: password
    });
    console.log('Login request sent with ID:', requestId);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username and password below to login to your account
            <div className="mt-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected to server' : 'Disconnected from server'}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              {error && (
                <Field>
                  <FieldDescription className="text-red-500">
                    {error}
                  </FieldDescription>
                  {!isConnected && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={reconnectWebSocket}
                      className="mt-2"
                    >
                      Reconnect
                    </Button>
                  )}
                </Field>
              )}
              <Field>
                <Button type="submit" disabled={isLoading || !isConnected}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}