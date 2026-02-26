"use client"

import { useState, useRef, useEffect } from "react"
import { TextEditor } from "../components/text-editor"
import { AICommandBar } from "../components/ai-command-bar"
import { Header } from "../components/header"
import { SharePanel } from "../components/share-panel"

const API_BASE = "http://localhost:4000/api"

export default function Home() {
  const [sessionId, setSessionId] = useState("")
  const [content, setContent] = useState("")
  const [files, setFiles] = useState([])
  const [isAIFocused, setIsAIFocused] = useState(false)
  const [sessionIdInput, setSessionIdInput] = useState("")
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [loadError, setLoadError] = useState("")

  const aiInputRef = useRef(null)
  const editorRef = useRef(null)

  /* ---------------- INIT SESSION ---------------- */
  useEffect(() => {
    const pathParts = window.location.pathname.split('/')
    if (pathParts.length === 3 && pathParts[1] === 's' && pathParts[2]) {
      // URL format: /s/ABC123
      setSessionId(pathParts[2])
    } else {
      // Create new session
      handleNewSession()
    }
  }, [])

  /* ---------------- LOAD SESSION ---------------- */
  useEffect(() => {
    if (!sessionId) return

    fetch(`${API_BASE}/sessions/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || "")
        setFiles(data.files || [])
      })
      .catch(err => console.error('Failed to load session:', err))
  }, [sessionId])

  /* ---------------- SAVE CONTENT ---------------- */
  const saveContent = async (value = content) => {
    setContent(value)
    if (!sessionId) return
    
    try {
      await fetch(`${API_BASE}/sessions/${sessionId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      })
    } catch (err) {
      console.error('Failed to save content:', err)
    }
  }

  /* ---------------- ACTIONS ---------------- */
  const handleNewSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/sessions/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      const newSessionId = data.id
      setSessionId(newSessionId)
      window.history.pushState({}, "", `/s/${newSessionId}`)
      setContent("")
      setFiles([])
    } catch (err) {
      console.error('Failed to create new session:', err)
    }
  }

  const handleLoadSession = async (id) => {
    if (!id.trim()) return
    
    setLoadError("") // Clear previous errors
    
    try {
      // First check if session exists
      const response = await fetch(`${API_BASE}/sessions/${id}`)
      
      if (!response.ok) {
        // Session doesn't exist
        setLoadError(`Session "${id}" does not exist`)
        return
      }
      
      // Session exists, load it
      setSessionId(id)
      window.history.pushState({}, "", `/s/${id}`)
      setSessionIdInput("")
      setLoadError("")
    } catch (err) {
      setLoadError(`Failed to load session: ${err.message}`)
    }
  }

  const handleAskAI = () => {
    // Scroll to AI input bar and focus
    aiInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => aiInputRef.current?.focus(), 300)
  }

  

  const handleClear = () => {
    setContent("")
  }

  const handleCopySessionId = () => {
    const textToCopy = sessionId
    
    // Create a temporary textarea element
    const textArea = document.createElement('textarea')
    textArea.value = textToCopy
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    
    try {
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        console.log('Session ID copied to clipboard')
        return true
      } else {
        console.error('Copy command failed')
        return false
      }
    } catch (err) {
      document.body.removeChild(textArea)
      console.error('Copy failed:', err)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        sessionId={sessionId}
        onAskAI={handleAskAI}
        onNewClipboard={handleNewSession}
        onToggleShare={() => setShowSharePanel(!showSharePanel)}
        onShowQR={() => {}}
        sessionIdInput={sessionIdInput}
        onSessionIdChange={setSessionIdInput}
        onLoadSession={handleLoadSession}
        onCopySessionId={handleCopySessionId}
        loadError={loadError}
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
              sessionId={sessionId}
            />
          </div>

          {/* Share Panel */}
          {showSharePanel && (
            <div className="w-64 border-l border-border overflow-hidden bg-card rounded-lg">
              <SharePanel sessionId={sessionId} onLoadSession={handleLoadSession} />
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
