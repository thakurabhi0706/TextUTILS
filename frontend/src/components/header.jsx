"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Share2, Sparkles, QrCode, Plus, Copy, Moon, Sun, User } from "lucide-react"
import { getApiUrl } from "../config/api"

export function Header({
  sessionId,
  onAskAI,
  onNewClipboard,
  onToggleShare,
  onShowQR,
  onToggleAccount,
  onSaveSession,
  saveDays,
  onSaveDaysChange,
  sessionIdInput,
  onSessionIdChange,
  onLoadSession,
  loadError,
  onCopySessionId,
  user,
  onLogout,
}) {
  const [copied, setCopied] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const shortSessionId = sessionId?.slice(0, 6).toUpperCase()

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage only after component mounts
    const saved = localStorage.getItem('theme')
    if (saved) {
      setIsDark(saved === 'dark')
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark, mounted])

  const handleCopyId = async () => {
    if (!shortSessionId) return

    try {
      await navigator.clipboard.writeText(shortSessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <header className="border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-[12px] font-semibold uppercase tracking-tight text-primary-foreground leading-none">
                tU
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">TextUTILS</h1>
              <p className="text-xs text-muted-foreground">
                Session: {" "}
                <span className="font-mono font-bold text-foreground">
                  {shortSessionId}
                </span>
                {sessionId && (
                  <button
                    onClick={handleCopyId}
                    className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title={copied ? "Copied!" : "Copy session ID"}
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={toggleTheme} variant="outline" size="sm" className="gap-2 bg-transparent">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button onClick={onNewClipboard} variant="outline" size="sm" className="gap-2 bg-transparent">
              <Plus className="w-4 h-4" />
              New
            </Button>

            <Button onClick={onAskAI} size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Button>

            <Button onClick={onToggleShare} variant="outline" size="sm" className="gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>

            <Button onClick={onShowQR} variant="outline" size="sm" className="gap-2 bg-transparent">
              <QrCode className="w-4 h-4" />
              QR
            </Button>

            <div className="ml-4">
              {user ? (
                <Button
                  onClick={onToggleAccount}
                  size="default"
                  className="rounded-full h-12 px-4 gap-3 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary font-semibold ring-1 ring-primary/40">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-primary-foreground">
                    {user.name ? user.name.split(" ")[0] : user.email}
                  </span>
                </Button>
              ) : (
                <Button asChild size="default" className="rounded-full h-12 px-4 gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-end max-w-sm">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">
              Enter Session ID
            </label>
            <Input
              value={sessionIdInput}
              onChange={(e) => onSessionIdChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && onLoadSession(sessionIdInput)}
              placeholder="e.g., X7K9P2"
              className="text-sm font-mono"
            />
          </div>
          <Button onClick={() => onLoadSession(sessionIdInput)} variant="outline" size="sm">
            Load
          </Button>
        </div>

        <div className="flex justify-end items-center gap-2">
          <select
            value={saveDays}
            onChange={(e) => onSaveDaysChange(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-2 py-1 text-sm"
            title="Retention days"
          >
            <option value={1}>1d</option>
            <option value={2}>2d</option>
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={0}>No expiry</option>
          </select>

          <Button onClick={() => onSaveSession()} size="sm" className="gap-2">
            SAVE SESSION
          </Button>
        </div>

        {loadError && (
          <div className="text-xs text-red-600 dark:text-red-400 max-w-sm">
            {loadError}
          </div>
        )}
      </div>
    </header>
  )
}
