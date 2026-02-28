"use client"

import { forwardRef, useRef, useEffect, useState } from "react"
import { Upload, Copy } from "lucide-react"
import { Button } from "../components/ui/button"
import { getApiUrl } from "../config/api"

const API_BASE = getApiUrl()

export const TextEditor = forwardRef(function TextEditor(
  {
    content,
    onChange,
    onAIFocus,
    onFilesUpload,
    sessionId,
    onSave,
    onClear,
    chatMessages,
    isAITyping,
    currentAIResponse,
    onClearChat,
  },
  ref
) {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [contentSize, setContentSize] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  useEffect(() => {
    setContentSize(content?.length || 0)
  }, [content])

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!sessionId) return

    selectedFiles.forEach((file) => {
      const formData = new FormData()
      formData.append("file", file)

      fetch(`${API_BASE}/sessions/${sessionId}/files`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((fileData) => {
          onFilesUpload?.([fileData])
        })
    })

    e.target.value = ""
  }

  const handleCopyMessage = async (message, index) => {
    try {
      await navigator.clipboard.writeText(message)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const truncateText = (text, maxLines = 3) => {
    const lines = text.split('\n')
    if (lines.length <= maxLines) return text
    
    return lines.slice(0, maxLines).join('\n') + '\n...'
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (err) {
      return ''
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-3 p-4 min-h-0">
      {/* Upload */}
      <div className="flex gap-2 items-center">
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
          >
            <span>
              <Upload className="w-4 h-4" />
              Upload File
            </span>
          </Button>
        </label>
        <span className="text-xs text-muted-foreground">
          or paste text/code below
        </span>
      </div>

      {/* Split View */}
      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* Left Side */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              Your Text / Code
            </label>
            <div className="text-xs text-muted-foreground">
              {contentSize.toLocaleString()} chars
              {contentSize > 8000000 && (
                <span className="text-red-500 ml-2">⚠️ Large content</span>
              )}
            </div>
          </div>
          <textarea
            ref={ref}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onAIFocus}
            placeholder="Paste your text or code here..."
            className="flex-1 min-h-0 w-full p-3 rounded-lg bg-card border border-input font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-y-auto"
          />
        </div>

        {/* Right Side - AI */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              Chat with AI
            </label>
            {chatMessages && chatMessages.length > 0 && (
              <Button
                onClick={onClearChat}
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent text-xs"
              >
                Clear Chat
              </Button>
            )}
          </div>

          <div className="flex-1 min-h-0 max-h-full w-full p-3 rounded-lg bg-card border border-input overflow-y-auto">
            {chatMessages && chatMessages.length > 0 ? (
              <div className="space-y-4 font-mono text-sm">
                {chatMessages.map((message, index) => (
                  <div key={index} className="space-y-2">
                    {message.type === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-primary text-primary-foreground p-2 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-medium">You</div>
                              <div className="text-xs text-muted-foreground">
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCopyMessage(message.text, index)}
                              className="ml-2 text-xs hover:bg-primary-foreground/20 p-1 rounded"
                              title={copiedIndex === index ? "Copied!" : "Copy message"}
                            >
                              {copiedIndex === index ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">
                            {truncateText(message.text)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-muted text-muted-foreground p-2 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-medium">AI</div>
                              <div className="text-xs text-muted-foreground">
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCopyMessage(message.text, `ai-${index}`)}
                              className="ml-2 text-xs hover:bg-muted-foreground/20 p-1 rounded"
                              title={copiedIndex === `ai-${index}` ? "Copied!" : "Copy message"}
                            >
                              {copiedIndex === `ai-${index}` ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">
                            {message.text}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Current typing AI response */}
                {isAITyping && currentAIResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-muted text-muted-foreground p-2 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-xs font-medium">AI</div>
                        <div className="flex items-center ml-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                          <span className="text-xs">Typing...</span>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {currentAIResponse}
                        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1"></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={bottomRef} />
              </div>
            ) : (
              <div className="text-muted-foreground text-sm text-center mt-4">
                No messages yet. Ask AI anything about your text...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        <Button onClick={onClear} variant="outline" size="sm">
          Clear
        </Button>
        <Button onClick={onSave} size="sm">
          Save
        </Button>
      </div>
    </div>
  )
})
