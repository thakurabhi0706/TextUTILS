"use client"

import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Share2, Sparkles, LinkIcon, QrCode, Plus } from "lucide-react"

export function Header({
  sessionId,
  onAskAI,
  onNewClipboard,
  onToggleShare,
  onShowQR,
  sessionIdInput,
  onSessionIdChange,
  onLoadSession,
}) {
  const shortSessionId = sessionId?.slice(0, 6).toUpperCase()

  const handleLinkClick = () => {
    const url = `${window.location.origin}?session=${sessionId}`
    navigator.clipboard.writeText(url)
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
                Session:{" "}
                <span className="font-mono font-bold text-foreground">
                  {shortSessionId}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
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
      </div>
    </header>
  )
}
