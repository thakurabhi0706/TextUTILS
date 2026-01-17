"use client"

import { forwardRef, useState } from "react"
import { Button } from "../components/ui/button"
import { ArrowUp } from "lucide-react"

export const AICommandBar = forwardRef(
  ({ onCommand, isFocused, onFocusChange }, ref) => {
    const [input, setInput] = useState("")

    const handleSend = () => {
      if (!input.trim()) return
      onCommand(input)
      setInput("")
    }

    return (
      <div className="border-t border-border bg-background/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <input
            ref={ref}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask AI anything about your text..."
            className="flex-1 px-4 py-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <Button onClick={handleSend} size="sm" className="gap-2">
            <ArrowUp className="w-4 h-4" />
            Send
          </Button>
        </div>
      </div>
    )
  }
)

AICommandBar.displayName = "AICommandBar"
