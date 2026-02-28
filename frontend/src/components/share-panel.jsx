"use client"

import { useState } from "react"
import { X, Copy, Mail, MessageCircle } from "lucide-react"

export function SharePanel({ sessionId, onClose, onLoadSession }) {
  const shareUrl = `${window.location.origin}/session/${sessionId}`
  const [loadId, setLoadId] = useState("")

  const handleLoadSession = () => {
    if (loadId.trim()) {
      onLoadSession?.(loadId.trim())
      setLoadId("")
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
  }

  const handleEmail = () => {
    const subject = "Shared TextUtils Clipboard"
    const body = `Here is the shared clipboard link:\n\n${shareUrl}`
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }

  const handleWhatsApp = () => {
    const text = `Check out this shared clipboard:\n${shareUrl}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl p-6 w-[380px] relative shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h3 className="text-base font-semibold mb-1">
          Share this clipboard
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Anyone with this link can view and edit the clipboard.
        </p>

        {/* Load Session Section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Load Session</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={loadId}
              onChange={(e) => setLoadId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleLoadSession()}
              placeholder="Enter session ID"
              className="flex-1 px-3 py-2 text-sm border rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleLoadSession}
              className="px-3 py-2 text-sm border rounded-md hover:bg-accent"
            >
              Load
            </button>
          </div>
        </div>

        {/* Link box */}
        <div className="border rounded-md px-3 py-2 text-sm font-mono mb-4 break-all">
          {shareUrl}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>

          <button
            onClick={handleEmail}
            className="flex items-center justify-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-accent col-span-2"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>
      </div>
    </div>
  )
}
