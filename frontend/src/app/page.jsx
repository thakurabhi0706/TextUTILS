"use client"

import { useState, useRef, useEffect } from "react"
import { TextEditor } from "../components/text-editor"
import { AICommandBar } from "../components/ai-command-bar"
import { Header } from "../components/header"
import { SharePanel } from "../components/share-panel"
import { generateSessionId } from "../lib/utils"
import { X, Download, Trash2 } from "lucide-react"

const API_BASE = "http://localhost:4000/api"

export default function Home() {
  const [sessionId, setSessionId] = useState("")
  const [content, setContent] = useState("")
  const [files, setFiles] = useState([])
  const [isAIFocused, setIsAIFocused] = useState(false)
  const [sessionIdInput, setSessionIdInput] = useState("")
  const [showShare, setShowShare] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const aiInputRef = useRef(null)
  const saveTimeout = useRef(null)

  /* INIT + LOAD SESSION */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    let id = params.get("session")

    if (!id) {
      id = generateSessionId()
      window.history.replaceState({}, "", `?session=${id}`)
    }

    setSessionId(id)

    fetch(`${API_BASE}/sessions/${id}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || "")
        setFiles(data.files || [])
      })
  }, [])

  /* AUTO SAVE CONTENT (debounced) */
  const persistContent = (value) => {
    setContent(value)

    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      fetch(`${API_BASE}/sessions/${sessionId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      })
    }, 400)
  }

  /* FILE HELPERS */
  const isImage = (type) => type?.startsWith("image/")

  const forceDownload = async (file) => {
    const res = await fetch(`http://localhost:4000${file.url}`)
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteFile = (index) => {
    fetch(`${API_BASE}/sessions/${sessionId}/files/${index}`, {
      method: "DELETE",
    }).then(() => {
      setFiles(prev => prev.filter((_, i) => i !== index))
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        sessionId={sessionId}
        onAskAI={() => {
          setIsAIFocused(true)
          setTimeout(() => aiInputRef.current?.focus(), 0)
        }}
        onNewClipboard={() => {
          const id = generateSessionId()
          setSessionId(id)
          setContent("")
          setFiles([])
          window.history.pushState({}, "", `?session=${id}`)
        }}
        onToggleShare={() => setShowShare(true)}
        onShowQR={() => setShowQR(true)}
        sessionIdInput={sessionIdInput}
        onSessionIdChange={setSessionIdInput}
        onLoadSession={(id) => {
          if (!id.trim()) return
          setSessionId(id)
          window.history.pushState({}, "", `?session=${id}`)

          fetch(`${API_BASE}/sessions/${id}`)
            .then(res => res.json())
            .then(data => {
              setContent(data.content || "")
              setFiles(data.files || [])
            })
        }}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <TextEditor
              content={content}
              onChange={persistContent}
              onAIFocus={() => setIsAIFocused(true)}
              onFilesUpload={(newFiles) =>
                setFiles(prev => [...prev, ...newFiles])
              }
              sessionId={sessionId}
              onSave={() => persistContent(content)}
              onClear={() => persistContent("")}
            />

            {/* FILE LIST */}
            {files.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Uploaded Files
                </p>

                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      {isImage(file.type) ? (
                        <button onClick={() => forceDownload(file)}>
                          <Download className="w-4 h-4" />
                        </button>
                      ) : (
                        <a
                          href={`http://localhost:4000${file.url}`}
                          download
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}

                      <button onClick={() => handleDeleteFile(index)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AICommandBar
          ref={aiInputRef}
          onCommand={() => {}}
          isFocused={isAIFocused}
          onFocusChange={setIsAIFocused}
        />
      </main>

      {showShare && (
        <SharePanel
          sessionId={sessionId}
          onClose={() => setShowShare(false)}
        />
      )}

      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-background rounded-xl p-6 w-[320px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold mb-1">
              Share via QR Code
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Scan to open the same clipboard.
            </p>

            <div className="flex justify-center bg-white rounded-lg p-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `${window.location.origin}?session=${sessionId}`
                )}`}
                alt="QR Code"
                className="w-52 h-52"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
