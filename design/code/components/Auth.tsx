import * as React from "react"
import { useState } from "react"
import { useAppStore } from "../store"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"

interface AuthProps {
  onAuthSuccess: () => void
}

export default function AuthPage({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const setUser = useAppStore((state) => state.setUser)
  const setSession = useAppStore((state) => state.setSession)

  const handleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const result = await window.electron.login(username, password)

      if (!result.success) {
        setError(result.error)
        return
      }

      const user = { id: result.session.user_id, username: result.session.username }
      setUser(user)
      setSession(result.session)
      onAuthSuccess()
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setError("")
    setLoading(true)

    try {
      const result = await window.electron.register(username, password)

      if (!result.success) {
        setError(result.error)
        return
      }

      setUser(result.user)
      setSession(result.session)
      onAuthSuccess()
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required")
      return
    }
    isLogin ? handleLogin() : handleRegister()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-primary">RedES Chat</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : isLogin ? "Sign in" : "Sign up"}
            </Button>

            {/* Toggle Button */}
            <Button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
              }}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
