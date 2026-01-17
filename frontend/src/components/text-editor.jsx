"use client"

import { forwardRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "../components/ui/button"

export const TextEditor = forwardRef(function TextEditor(
  { content, onChange, onAIFocus, onFilesUpload, sessionId, onSave, onClear },
  ref
) {
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!sessionId) return

    selectedFiles.forEach((file) => {
      const formData = new FormData()
      formData.append("file", file)

      fetch(`http://localhost:4000/api/sessions/${sessionId}/files`, {
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

  return (
    <div className="flex flex-col h-full gap-4 p-6">
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

      <textarea
        ref={ref}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onAIFocus}
        placeholder="Paste your text or code here..."
        className="flex-1 w-full p-4 rounded-lg bg-card border border-input font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

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
