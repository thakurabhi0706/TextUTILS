"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { TextEditor } from "../components/text-editor"
import { AICommandBar } from "../components/ai-command-bar"
import { Header } from "../components/header"
import { SharePanel } from "../components/share-panel"
import { X, Download, Trash2 } from "lucide-react"
import { getApiUrl, APP_URL } from "../config/api"

export default function Home() {
  const searchParams = useSearchParams()
  
  const [sessionId, setSessionId] = useState("")
  const [content, setContent] = useState("")
  const [files, setFiles] = useState([])
  const [sessionIdInput, setSessionIdInput] = useState("")
  const [isAIFocused, setIsAIFocused] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [chatMessages, setChatMessages] = useState([])
  const [isAITyping, setIsAITyping] = useState(false)
  const [currentAIResponse, setCurrentAIResponse] = useState("")



  const clearChat = () => {

    setChatMessages([])

    if (sessionId) {

      fetch(`${getApiUrl()}/sessions/${sessionId}/chat-messages`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ messages: [] }),

      }).catch(err => console.error('Failed to clear chat:', err))

    }

  }



  const aiInputRef = useRef(null)

  const saveTimeout = useRef(null)



  const loadSession = async (id) => {

    setSessionId(id)

    const res = await fetch(`${getApiUrl()}/sessions/${id}`)

    const data = await res.json()

    setContent(data.content || "")

    setFiles(data.files || [])

    setChatMessages(data.chatMessages || [])

  }



  const handleAICommand = async (prompt) => {

    // Add user query to chat

    const userMessage = { type: 'user', text: prompt, timestamp: new Date().toISOString() }

    setChatMessages(prev => [...prev, userMessage])

    

    // Start typing effect

    setIsAITyping(true)

    setCurrentAIResponse("")

    

    const res = await fetch(`${getApiUrl()}/ai/ask`, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ prompt, content }),

    })



    const data = await res.json()



    if (!data.reply) {

      alert("AI failed. Check backend logs.")

      setIsAITyping(false)

      return

    }



    // Typing effect for AI response

    const fullResponse = data.reply

    let currentIndex = 0

    

    const typeWriter = async () => {

      if (currentIndex < fullResponse.length) {

        setCurrentAIResponse(prev => prev + fullResponse[currentIndex])

        currentIndex++

        setTimeout(typeWriter, 20) // Adjust speed here

      } else {

        // Typing finished, add to chat messages

        const aiMessage = { type: 'ai', text: fullResponse, timestamp: new Date().toISOString() }

        setChatMessages(prev => [...prev, aiMessage])

        setIsAITyping(false)

        setCurrentAIResponse("")

        

        // Save chat messages to backend

        try {

          const response = await fetch(`${getApiUrl()}/sessions/${sessionId}/chat-messages`, {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({ messages: [...chatMessages, userMessage, aiMessage] }),

          })

          

          if (!response.ok) {

            const error = await response.json()

            if (response.status === 413 || error.error?.includes('too large')) {

              alert('Chat history is getting too large! Consider clearing the chat to continue.')

            }

          }

        } catch (err) {

          console.error('Failed to save chat messages:', err)

        }

      }

    }

    

    typeWriter()

  }



  useEffect(() => {
    // Check for session in query params first
    const urlId = searchParams.get("session")
    
    if (urlId) {
      // Load session from query parameter
      loadSession(urlId)
    } else {
      // Check if we're on the root path without session param
      // Only create new session if no session is specified
      fetch(`${getApiUrl()}/sessions/new`, { method: "POST" })
        .then(res => res.json())
        .then(({ id }) => {
          window.history.replaceState({}, "", `?session=${id}`)
          loadSession(id)
        })
        .catch(err => console.error('Failed to create session:', err))
    }
  }, [searchParams])



  const persistContent = (value) => {

    setContent(value)

    clearTimeout(saveTimeout.current)



    saveTimeout.current = setTimeout(async () => {

      // Check content size before even attempting to save

      if (value && value.length > 8000000) { // 8MB limit with buffer

        alert('Content is getting very large! Consider clearing some content or chat messages to prevent save errors.')

        return

      }

      

      try {

        const response = await fetch(`${getApiUrl()}/sessions/${sessionId}/content`, {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ content: value }),

        })

        

        if (!response.ok) {

          const error = await response.json()

          if (response.status === 413 || error.error?.includes('too large')) {

            alert('Content is too large! Please reduce the text size or clear some chat messages.')

          } else {

            console.error('Failed to save content:', error)

          }

        }

      } catch (err) {

        if (err.message?.includes('413') || err.message?.includes('too large')) {

          alert('Content is too large! Please reduce the text size or clear some chat messages.')

        } else {

          console.error('Failed to save content:', err)

        }

      }

    }, 400)

  }



  const handleNewClipboard = () => {

    fetch(`${getApiUrl()}/sessions/new`, { method: "POST" })

      .then(res => res.json())

      .then(({ id }) => {

        window.history.pushState({}, "", `?session=${id}`)

        loadSession(id)

      })

  }



  const handleLoadSession = async (id) => {

    if (!id.trim()) return

    

    setLoadError("") // Clear previous errors

    

    try {

      const response = await fetch(`${getApiUrl()}/sessions/${id}`)

      

      if (!response.ok) {

        setLoadError(`Session "${id}" does not exist`)

        return

      }

      

      window.history.pushState({}, "", `?session=${id}`)

      loadSession(id.trim().toUpperCase())

      setSessionIdInput("")

      setLoadError("")

    } catch (err) {

      setLoadError(`Failed to load session: ${err.message}`)

    }

  }



  const isImage = (type) => type?.startsWith("image/")

  const forceDownload = async (file) => {
    const res = await fetch(`${getApiUrl().replace('/api', '')}${file.url}`)
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.originalname
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }



  const handleDeleteFile = (index) => {

    fetch(`${getApiUrl()}/sessions/${sessionId}/files/${index}`, {

      method: "DELETE",

    }).then(() => {

      setFiles(prev => prev.filter((_, i) => i !== index))

    })

  }



  return (

    <div className="h-screen bg-background flex flex-col overflow-hidden">

      <Header

        sessionId={sessionId}

        sessionIdInput={sessionIdInput}

        onSessionIdChange={setSessionIdInput}

        onLoadSession={handleLoadSession}

        onNewClipboard={handleNewClipboard}

        loadError={loadError}

        onAskAI={() => {

          setIsAIFocused(true)

          setTimeout(() => aiInputRef.current?.focus(), 0)

        }}

        onToggleShare={() => setShowShare(true)}

        onShowQR={() => setShowQR(true)}

      />



      <main className="flex-1 flex flex-col overflow-hidden min-h-0">

        <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">

          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">

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

              chatMessages={chatMessages}

              isAITyping={isAITyping}

              currentAIResponse={currentAIResponse}

              onClearChat={clearChat}

            />



            {files.length > 0 && (

              <div className="border rounded-lg p-3 space-y-2">

                <p className="text-xs font-semibold text-muted-foreground">

                  Uploaded Files

                </p>



                {files.map((file, index) => (

                  <div

                    key={index}

                    className="flex items-center justify-between p-3 border rounded-lg bg-card"

                  >

                    <div className="flex items-center gap-3">

                      {isImage(file.mimetype) ? (

                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">

                          🖼️

                        </div>

                      ) : (

                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">

                          📄

                        </div>

                      )}

                      <div>

                        <p className="text-sm font-medium">{file.originalname}</p>

                        <p className="text-xs text-muted-foreground">

                          {(file.size / 1024).toFixed(1)} KB • {file.mimetype}

                        </p>

                      </div>

                    </div>



                    <div className="flex gap-3">

                      {isImage(file.mimetype) ? (

                        <button onClick={() => forceDownload(file)}>

                          <Download className="w-4 h-4" />

                        </button>

                      ) : (

                        <a

                          href={`${getApiUrl().replace('/api', '')}${file.url}`}

                          download={file.originalname}

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



        {/* About Us Section */}

        <div className="border-t border-border bg-background/50 backdrop-blur-sm">

          <div className="px-6 py-3">

            <div className="max-w-4xl mx-auto">

              <h3 className="text-sm font-semibold text-foreground mb-1">About TextUtils</h3>

              <p className="text-xs text-muted-foreground leading-relaxed">

                TextUtils is your intelligent text companion that helps you analyze, transform, and understand your content with AI-powered assistance. 

                Whether you're coding, writing, or processing documents, our AI tools provide instant insights and suggestions to enhance your productivity.

              </p>

            </div>

          </div>

        </div>



        <AICommandBar

          ref={aiInputRef}

          isFocused={isAIFocused}

          onFocusChange={setIsAIFocused}

          onCommand={handleAICommand}

        />

      </main>



      {showShare && (

        <SharePanel

          sessionId={sessionId}

          onClose={() => setShowShare(false)}

          onLoadSession={handleLoadSession}

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

                  `${APP_URL}/s/${sessionId}`

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

