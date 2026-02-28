"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Share2, Sparkles, LinkIcon, QrCode, Plus, Copy, Moon, Sun } from "lucide-react"
import { getApiUrl } from "@/config/api"

export function Header({
  sessionId,
  onAskAI,
  onNewClipboard,
  onToggleShare,
  onShowQR,
  sessionIdInput,
  onSessionIdChange,
  onLoadSession,
  loadError,
  onCopySessionId,
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

  const handleLinkClick = () => {
    const url = `${window.location.origin}/s/${sessionId}`
    navigator.clipboard.writeText(url)
  }

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
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">TextUtils</h1>
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

          <div className="flex gap-2">
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

            <Button onClick={handleLinkClick} variant="outline" size="sm" className="gap-2 bg-transparent">
              <LinkIcon className="w-4 h-4" />
              Link
            </Button>

            <Button onClick={onShowQR} variant="outline" size="sm" className="gap-2 bg-transparent">
              <QrCode className="w-4 h-4" />
              QR
            </Button>
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

        {loadError && (
          <div className="text-xs text-red-600 dark:text-red-400 max-w-sm">
            {loadError}
          </div>
        )}
      </div>
    </header>
  )
}
