"use client"

import { useEffect, useState } from "react"
import { X, ClipboardList, LogOut } from "lucide-react"
import { getApiUrl } from "../config/api"
import { toast } from 'sonner'

export function AccountPanel({ user, onClose, onLogout, onLoadSession, refreshKey, currentSessionId, saveDays }) {
  const [savedSessions, setSavedSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [retention, setRetention] = useState({})

  const getDefaultRetention = (expiresAt) => {
    if (!expiresAt) return 0

    const diffMs = new Date(expiresAt).getTime() - Date.now()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) return 1
    if (diffDays <= 2) return 2
    if (diffDays <= 7) return 7
    return 30
  }

  const loadSessions = () => {
    if (!user) return

    setLoading(true)
    setError("")

    fetch(`${getApiUrl()}/sessions/mine`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) {
          setSavedSessions(data.sessions)
          const retentionMap = {}
          data.sessions.forEach((session) => {
            retentionMap[session.sessionId] = getDefaultRetention(session.expiresAt)
          })
          setRetention(retentionMap)
        } else {
          setSavedSessions([])
          setRetention({})
          setError("No saved sessions found.")
        }
      })
      .catch(() => {
        setSavedSessions([])
        setRetention({})
        setError("Unable to load saved sessions.")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadSessions()
  }, [user, refreshKey])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-end p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name || "Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:text-foreground"
            aria-label="Close account panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-3xl bg-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Saved sessions
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {savedSessions.length} saved {savedSessions.length === 1 ? "session" : "sessions"}
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading sessions…</p>}
          {error && !loading && <p className="text-sm text-red-600">{error}</p>}

          {!loading && savedSessions.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {savedSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-sm">{session.shortCode}</span>
                          <div className="text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={retention[session.sessionId] ?? 0}
                            onChange={(e) => {
                              const days = Number(e.target.value)
                              setRetention(r => ({ ...r, [session.sessionId]: days }))
                            }}
                            className="rounded-md border border-border bg-card px-2 py-1 text-sm"
                          >
                            <option value={0}>No expiry</option>
                            <option value={1}>1d</option>
                            <option value={2}>2d</option>
                            <option value={7}>7d</option>
                            <option value={30}>30d</option>
                          </select>
                          <button
                            onClick={async () => {
                              const days = Number(retention[session.sessionId] ?? 0)
                              try {
                                const res = await fetch(`${getApiUrl()}/sessions/${session.sessionId}/retain`, {
                                  method: 'POST',
                                  credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ days }),
                                })
                                if (res.ok) {
                                  toast.success('Retention updated')
                                  loadSessions()
                                } else {
                                  const d = await res.json()
                                  toast.error(d.error || 'Failed to update retention')
                                }
                              } catch (err) {
                                console.error(err)
                                toast.error('Failed to update retention')
                              }
                            }}
                            className="px-3 py-1 rounded-md border border-border text-sm"
                          >
                            Set
                          </button>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground truncate">{session.preview || 'No preview available'}</p>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => { onLoadSession(session.sessionId); onClose() }}
                          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                        >
                          Load
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${getApiUrl()}/sessions/${session.sessionId}`, {
                                method: 'DELETE',
                                credentials: 'include',
                              })
                              if (res.ok) {
                                toast.success('Session deleted')
                                loadSessions()
                              } else {
                                const d = await res.json()
                                toast.error(d.error || 'Failed to delete session')
                              }
                            } catch (err) {
                              console.error(err)
                              toast.error('Failed to delete session')
                            }
                          }}
                          className="rounded-md border border-border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onLogout()
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border border-border bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
