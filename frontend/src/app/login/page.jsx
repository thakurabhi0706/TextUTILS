"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { getApiUrl } from "../../config/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }

      router.push("/")
    } catch (err) {
      setError("Login failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/95 p-8 shadow-xl backdrop-blur-xl relative">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
            aria-label="Close login"
          >
            <X className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-semibold mb-4">Login</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <Link href="/register" className="text-sm text-primary underline">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  </div>
  )
}
