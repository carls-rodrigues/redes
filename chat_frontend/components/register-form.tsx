"use client";

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

export function RegisterForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { sendMessage, lastMessage, isConnected } = useWebSocket()
  const router = useRouter()

  useEffect(() => {
    if (lastMessage) {
      console.log('Register form received message:', lastMessage);
      // Check for register response - either by type or by checking status
      if ((lastMessage.type === 'register' || lastMessage.status) && lastMessage.status === 'ok') {
        console.log('Registration successful');
        // Registration successful
        setSuccess('Account created! Please login.');
        setError("");
        setIsLoading(false);
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if ((lastMessage.type === 'register' || lastMessage.status) && lastMessage.status === 'error') {
        console.log('Registration failed:', lastMessage.message);
        // Registration failed
        setError(lastMessage.message || 'Registration failed');
        setSuccess("");
        setIsLoading(false);
      }
    }
  }, [lastMessage, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    setIsLoading(true);

    sendMessage({
      type: 'register',
      username: username,
      password: password
    });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
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
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            {error && (
              <Field>
                <FieldDescription className="text-red-500">
                  {error}
                </FieldDescription>
              </Field>
            )}
            {success && (
              <Field>
                <FieldDescription className="text-green-500">
                  {success}
                </FieldDescription>
              </Field>
            )}
            <Field>
              <Button type="submit" disabled={isLoading || !isConnected}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}