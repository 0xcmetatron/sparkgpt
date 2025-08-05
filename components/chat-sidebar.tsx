"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, MessageSquare, Edit2, Trash2, Check, X } from "lucide-react"

interface ChatSession {
  id: number
  session_name: string
  created_at: string
  updated_at: string
}

interface ChatSidebarProps {
  userId: number | null
  currentSessionId: number | null
  onSessionSelect: (sessionId: number) => void
  onNewChat: () => void
}

export function ChatSidebar({ userId, currentSessionId, onSessionSelect, onNewChat }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    if (userId) {
      fetchSessions()
    }
  }, [userId])

  const fetchSessions = async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/chat/sessions?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    }
  }

  const createNewSession = async () => {
    if (!userId) return
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionName: "New Chat" }),
      })
      if (response.ok) {
        const data = await response.json()
        fetchSessions()
        onNewChat()
        onSessionSelect(data.sessionId)
      }
    } catch (error) {
      console.error("Failed to create session:", error)
    }
  }

  const updateSessionName = async (sessionId: number, newName: string) => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, sessionName: newName }),
      })
      if (response.ok) {
        fetchSessions()
        setEditingId(null)
      }
    } catch (error) {
      console.error("Failed to update session name:", error)
    }
  }

  const deleteSession = async (sessionId: number) => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (response.ok) {
        fetchSessions()
        if (currentSessionId === sessionId) {
          onNewChat()
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id)
    setEditName(session.session_name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName("")
  }

  const saveEdit = (sessionId: number) => {
    if (editName.trim()) {
      updateSessionName(sessionId, editName.trim())
    }
  }

  if (!userId) return null

  return (
    <div className="w-64 bg-chatgpt-sidebar-bg p-4 flex flex-col h-full">
      <Button
        onClick={createNewSession}
        className="w-full mb-4 bg-chatgpt-input-bg hover:bg-chatgpt-message-bg text-chatgpt-text-primary border border-chatgpt-border"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Chat
      </Button>

      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card
                className={`cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "bg-chatgpt-accent-blue/20 border-chatgpt-accent-blue"
                    : "bg-chatgpt-input-bg border-chatgpt-border hover:bg-chatgpt-message-bg"
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between group">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-chatgpt-sidebar-bg border-chatgpt-border text-chatgpt-text-primary text-sm h-8"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") saveEdit(session.id)
                            if (e.key === "Escape") cancelEditing()
                          }}
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEdit(session.id)}
                          className="text-green-400 hover:text-green-300 p-1"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-2 flex-1 min-w-0"
                          onClick={() => onSessionSelect(session.id)}
                        >
                          <MessageSquare className="w-4 h-4 text-chatgpt-text-secondary flex-shrink-0" />
                          <span className="text-chatgpt-text-primary text-sm truncate">{session.session_name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditing(session)
                            }}
                            className="text-chatgpt-text-secondary hover:text-chatgpt-text-primary p-1"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            className="text-chatgpt-text-secondary hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-chatgpt-text-secondary mt-1">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
