"use client"

import { useState, useRef, useEffect } from "react"
import { TextEditor } from "../components/text-editor"
import { AICommandBar } from "../components/ai-command-bar"
import { Header } from "../components/header"
import { generateSessionId } from "../lib/utils"
import { SharePanel } from "../components/share-panel"

const API_BASE = "http://localhost:4000/api"

export default function Home() {
  const [sessionId, setSessionId] = useState("")
  const [content, setContent] = useState("")
  const [isAIFocused, setIsAIFocused] = useState(false)
  const [sessionIdInput, setSessionIdInput] = useState("")
  const [showSharePanel, setShowSharePanel] = useState(false)

  const aiInputRef = useRef(null)
  const editorRef = useRef(null)

  /* ---------------- INIT SESSION ---------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    let id = params.get("session")

    if (!id) {
      id = generateSessionId()
      window.history.replaceState({}, "", `?session=${id}`)
    }

    setSessionId(id)
  }, [])

  /* ---------------- LOAD SESSION ---------------- */
  useEffect(() => {
    if (!sessionId) return

    fetch(`${API_BASE}/sessions/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || "")
      })
  }, [sessionId])

  /* ---------------- SAVE CONTENT ---------------- */
  const saveContent = async (value = content) => {
    setContent(value)
    await fetch(`${API_BASE}/sessions/${sessionId}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
    })
  }

  /* ---------------- ACTIONS ---------------- */
  const handleLoadSession = (id) => {
    if (!id.trim()) return
    setSessionId(id)
    window.history.pushState({}, "", `?session=${id}`)
    setSessionIdInput("")
  }

  const handleAskAI = () => {
    setIsAIFocused(true)
    setTimeout(() => aiInputRef.current?.focus(), 0)
  }

  const handleAICommand = (command) => {
    // AI backend hook goes here later
    console.log("AI Command:", command)
    console.log("Content:", content)
  }

  const handleClear = () => {
    saveContent("")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        sessionId={sessionId}
        onAskAI={handleAskAI}
        sessionIdInput={sessionIdInput}
        onSessionIdChange={setSessionIdInput}
        onLoadSession={handleLoadSession}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <TextEditor
              ref={editorRef}
              content={content}
              onChange={saveContent}
              onAIFocus={() => setIsAIFocused(true)}
              onSave={() => saveContent()}
              onClear={handleClear}
            />
          </div>

          {/* Share Panel */}
          {showSharePanel && (
            <div className="w-64 border-l border-border overflow-hidden bg-card rounded-lg">
              <SharePanel sessionId={sessionId} />
            </div>
          )}
        </div>

        {/* AI Command Bar */}
        <AICommandBar
          ref={aiInputRef}
          onCommand={handleAICommand}
          isFocused={isAIFocused}
          onFocusChange={setIsAIFocused}
        />
      </main>
    </div>
  )
}
