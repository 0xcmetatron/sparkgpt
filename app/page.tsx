"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Zap, LogIn, UserPlus, Key, LogOut, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MarkdownMessage } from "@/components/markdown-message"
import { XLogo } from "@/components/x-logo"
import { AuthModal } from "@/components/auth-modal"
import { ApiKeysModal } from "@/components/api-keys-modal"
import { ChatSidebar } from "@/components/chat-sidebar"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatUser {
  id: number
  username: string
  email: string
}

export default function ValentineGPT() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm **MoonitGPT**, your AI assistant created by **ChatGPT**. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<ChatUser | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showApiKeysModal, setShowApiKeysModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // State for mobile sidebar
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      }
    }
    checkAuth()
  }, [])

  const loadChatHistory = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/chat/history?sessionId=${sessionId}`)
      if (response.ok) {
        const history = await response.json()
        if (history.length > 0) {
          const formattedHistory = history.map((msg: any) => ({
            id: msg.message_id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp),
          }))
          setMessages(formattedHistory)
        } else {
          // If no history, show welcome message
          setMessages([
            {
              id: "1",
              content:
                "Hello! I'm **MoonitGPT**, your AI assistant created by **ChatGPT**. How can I help you today?",
              role: "assistant",
              timestamp: new Date(),
            },
          ])
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
    }
  }

  const handleSessionSelect = (sessionId: number) => {
    setCurrentSessionId(sessionId)
    loadChatHistory(sessionId)
    setIsSidebarOpen(false) // Close sidebar on session select
  }

  const handleNewChat = () => {
    setCurrentSessionId(null)
    setMessages([
      {
        id: "1",
        content: "Hello! I'm **MoonitGPT**, your AI assistant created by **ChatGPT**. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
    setIsSidebarOpen(false) // Close sidebar on new chat
  }

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const userData = await response.json()
    setUser(userData)
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const userData = await response.json()
    setUser(userData)
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setCurrentSessionId(null)
    setMessages([
      {
        id: "1",
        content: "Hello! I'm **MoonitGPT**, your AI assistant created by **ChatGPT**. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          userId: user?.id,
          messageId: userMessage.id,
          sessionId: currentSessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || "I'm sorry, I couldn't process your request right now.",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Update current session ID if a new one was created
        if (data.sessionId && !currentSessionId) {
          setCurrentSessionId(data.sessionId)
        }
      } else {
        throw new Error("Failed to get response")
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm experiencing some technical difficulties. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-screen bg-chatgpt-dark-bg text-chatgpt-text-primary flex">
      {/* Mobile Sidebar Toggle */}
      {user && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 left-4 z-50 bg-chatgpt-input-bg text-chatgpt-text-primary hover:bg-chatgpt-message-bg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Chat Sidebar */}
      <AnimatePresence>
        {user && (isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-40 w-64 bg-chatgpt-sidebar-bg flex flex-col border-r border-chatgpt-border lg:static lg:translate-x-0"
          >
            <ChatSidebar
              userId={user.id}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              onNewChat={handleNewChat}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-chatgpt-main-bg relative z-0">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-[#343541] border-b border-chatgpt-border"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img src="/imagine-gpt-logo.png" alt="ImagineGPT" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                MoonitGPT
              </h1>
              <p className="text-sm text-gray-400">Created by Chatgpt</p>
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 hidden sm:inline">Welcome, {user.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKeysModal(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <Key className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Login
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Register
                </Button>
              </div>
            )}
          </div>
        </motion.header>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex gap-3 p-4 rounded-lg ${
                  message.role === "user" ? "justify-end" : "justify-start bg-chatgpt-message-bg"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8 flex-shrink-0 bg-chatgpt-accent-blue text-white">
                    <AvatarFallback className="p-0 bg-chatgpt-accent-blue">
                      <img
                        src="/imagine-gpt-logo.png"
                        alt="ImagineGPT"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] ${
                    message.role === "user"
                      ? "bg-chatgpt-input-bg text-chatgpt-text-primary rounded-lg p-3"
                      : "text-chatgpt-text-primary"
                  }`}
                >
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    {message.role === "assistant" ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </motion.div>
                  <p className="text-xs text-chatgpt-text-secondary opacity-80 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === "user" && (
                  <Avatar className="w-8 h-8 flex-shrink-0 bg-chatgpt-accent-blue text-white">
                    <AvatarFallback className="bg-chatgpt-accent-blue text-white">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start p-4 rounded-lg bg-chatgpt-message-bg"
            >
              <Avatar className="w-8 h-8 flex-shrink-0 bg-chatgpt-accent-blue text-white">
                <AvatarFallback className="p-0 bg-chatgpt-accent-blue">
                  <img
                    src="/imagine-gpt-logo.png"
                    alt="ImagineGPT"
                    className="w-full h-full object-cover rounded-full"
                  />
                </AvatarFallback>
              </Avatar>
              <div className="bg-chatgpt-input-bg p-3 rounded-lg">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                      className="w-2 h-2 bg-chatgpt-accent-blue rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-chatgpt-main-bg">
          <div className="relative max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send a message..."
              className="w-full pr-12 bg-chatgpt-input-bg border border-chatgpt-border text-chatgpt-text-primary placeholder-chatgpt-text-secondary focus:border-chatgpt-accent-blue focus:ring-chatgpt-accent-blue rounded-lg py-2 pl-4"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent text-chatgpt-text-secondary hover:text-chatgpt-accent-blue p-2"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-chatgpt-text-secondary text-center mt-2">
            MoonitGPT can make mistakes. Consider checking important information.
          </p>
        </motion.div>
      </div>

      {/* Right Sidebar (Features & X.com) - only visible on large screens */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="w-80 border-l border-chatgpt-border bg-chatgpt-sidebar-bg p-6 hidden lg:block"
      >
        <div className="space-y-6">
          {/* X.com Follow Section */}
          <Card className="bg-chatgpt-message-bg border-chatgpt-border p-6">
            <div className="text-center space-y-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mx-auto w-16 h-16 bg-black rounded-md flex items-center justify-center"
              >
                <XLogo className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-chatgpt-text-primary mb-2">Follow MoonitGPT on X</h3>
                <p className="text-chatgpt-text-secondary text-sm mb-4">
                  Stay updated with the latest features and ideas from MoonitGPT
                </p>
                <motion.a
                  href="https://x.com/MoonitGPT"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-full font-medium transition-colors border border-chatgpt-border"
                >
                  <XLogo className="w-4 h-4" />
                  Follow MoonitGPT
                </motion.a>
              </div>
            </div>
          </Card>

          {/* Features */}
          <Card className="bg-chatgpt-message-bg border-chatgpt-border p-6">
            <h3 className="text-lg font-semibold text-chatgpt-text-primary mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-chatgpt-accent-blue" />
              Features
            </h3>
            <div className="space-y-3">
              {[
                "Code assistance",
                "Creative writing",
                "Problem solving",
                "Research help",
                "Real-time responses",
                user ? "Multiple chats" : "Register for multiple chats",
                user ? "API access" : "Register for API",
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 text-chatgpt-text-secondary"
                >
                  <div className="w-2 h-2 bg-chatgpt-accent-blue rounded-full" />
                  {feature}
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <Card className="bg-chatgpt-message-bg border-chatgpt-border p-6">
            <h3 className="text-lg font-semibold text-chatgpt-text-primary mb-4">Chat Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-chatgpt-text-secondary">Messages today</span>
                <span className="text-chatgpt-text-primary font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-chatgpt-text-secondary">Response time</span>
                <span className="text-green-400 font-medium">{"< 2s"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-chatgpt-text-secondary">Status</span>
                <span className="text-green-400 font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              </div>
              {user && (
                <div className="flex justify-between">
                  <span className="text-chatgpt-text-secondary">User</span>
                  <span className="text-chatgpt-accent-blue font-medium">{user.username}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </motion.aside>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <ApiKeysModal isOpen={showApiKeysModal} onClose={() => setShowApiKeysModal(false)} userId={user?.id || null} />
    </div>
  )
}
