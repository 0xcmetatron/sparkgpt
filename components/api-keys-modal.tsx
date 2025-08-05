"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { X, Key, Copy, Plus, Eye, EyeOff, AlertCircle, Database } from "lucide-react"

interface ApiKey {
  id: number
  name: string
  api_key: string
  credits_used: number
  credits_limit: number
  last_reset: string
  created_at: string
}

interface ApiKeysModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number | null
}

export function ApiKeysModal({ isOpen, onClose, userId }: ApiKeysModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showKeys, setShowKeys] = useState<{ [key: number]: boolean }>({})
  const [error, setError] = useState("")
  const [dbStatus, setDbStatus] = useState<string>("")
  const [apiKeyCount, setApiKeyCount] = useState(0)
  const MAX_API_KEYS = 1 // You can change this number to allow more API keys

  useEffect(() => {
    if (isOpen && userId) {
      fetchApiKeys()
      testDatabase()
    }
  }, [isOpen, userId])

  const testDatabase = async () => {
    try {
      const response = await fetch("/api/test-db")
      const result = await response.json()
      if (result.success) {
        setDbStatus("Database connection OK")
      } else {
        setDbStatus(`Database error: ${result.details}`)
      }
    } catch (error) {
      setDbStatus("Database connection failed")
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`/api/user/api-keys?userId=${userId}`)
      if (response.ok) {
        const keys = await response.json()
        setApiKeys(keys)
        setApiKeyCount(keys.length)
      } else {
        console.error("Failed to fetch API keys:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim() || !userId) {
      setError("Please enter a name for the API key")
      return
    }

    if (apiKeyCount >= MAX_API_KEYS) {
      setError(`You can only create ${MAX_API_KEYS} API key${MAX_API_KEYS > 1 ? "s" : ""} per account`)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("Creating API key with:", { userId, name: newKeyName.trim() })

      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          name: newKeyName.trim(),
        }),
      })

      const result = await response.json()
      console.log("API key creation response:", result)

      if (response.ok && result.success) {
        setNewKeyName("")
        setError("")
        await fetchApiKeys() // Refresh the list
      } else {
        setError(result.message || result.error || "Failed to create API key")
        console.error("API key creation failed:", result)
      }
    } catch (error) {
      console.error("Failed to create API key:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const toggleKeyVisibility = (keyId: number) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 8)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        >
          <Card className="bg-chatgpt-main-bg border-chatgpt-border">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute right-2 top-2 text-chatgpt-text-secondary hover:text-chatgpt-text-primary"
              >
                <X className="w-4 h-4" />
              </Button>
              <CardTitle className="text-chatgpt-text-primary flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys Management
              </CardTitle>
              {dbStatus && (
                <div className="flex items-center gap-2 text-xs">
                  <Database className="w-3 h-3" />
                  <span className={dbStatus.includes("OK") ? "text-green-400" : "text-red-400"}>{dbStatus}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create new API key */}
              <div className="space-y-3">
                <h3 className="text-chatgpt-text-primary font-medium">Create New API Key</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="API Key Name (e.g., My Bot, Production App)"
                      value={newKeyName}
                      onChange={(e) => {
                        setNewKeyName(e.target.value)
                        setError("") // Clear error when user types
                      }}
                      className="bg-chatgpt-input-bg border-chatgpt-border text-chatgpt-text-primary"
                      disabled={isLoading}
                      maxLength={50}
                    />
                    <Button
                      onClick={createApiKey}
                      disabled={isLoading || !newKeyName.trim() || apiKeyCount >= MAX_API_KEYS}
                      className="bg-chatgpt-accent-blue hover:bg-chatgpt-accent-blue/80 whitespace-nowrap text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isLoading ? "Creating..." : apiKeyCount >= MAX_API_KEYS ? "Limit Reached" : "Create"}
                    </Button>
                  </div>
                  <p className="text-xs text-chatgpt-text-secondary">
                    You can create up to {MAX_API_KEYS} API key{MAX_API_KEYS > 1 ? "s" : ""} per account. ({apiKeyCount}
                    /{MAX_API_KEYS} used)
                  </p>
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* API Keys list */}
              <div className="space-y-3">
                <h3 className="text-chatgpt-text-primary font-medium">Your API Keys ({apiKeys.length})</h3>
                {apiKeys.length === 0 ? (
                  <p className="text-chatgpt-text-secondary">No API keys created yet.</p>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <Card key={key.id} className="bg-chatgpt-message-bg border-chatgpt-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-chatgpt-text-primary font-medium">{key.name}</h4>
                            <span className="text-xs text-chatgpt-text-secondary">
                              Created: {new Date(key.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <code className="bg-chatgpt-input-bg text-chatgpt-accent-blue px-2 py-1 rounded text-sm flex-1 font-mono">
                              {showKeys[key.id] ? key.api_key : maskApiKey(key.api_key)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="text-chatgpt-text-secondary hover:text-chatgpt-text-primary"
                            >
                              {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(key.api_key)}
                              className="text-chatgpt-text-secondary hover:text-chatgpt-text-primary"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-chatgpt-text-secondary">
                              Credits: {key.credits_used}/{key.credits_limit}
                            </span>
                            <span className="text-chatgpt-text-secondary">
                              Reset: {new Date(key.last_reset).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="w-full bg-chatgpt-border rounded-full h-2 mt-2">
                            <div
                              className="bg-chatgpt-accent-blue h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(key.credits_used / key.credits_limit) * 100}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* API Documentation */}
              <div className="space-y-3">
                <h3 className="text-chatgpt-text-primary font-medium">API Documentation</h3>
                <Card className="bg-chatgpt-message-bg border-chatgpt-border">
                  <CardContent className="p-4">
                    <h4 className="text-chatgpt-text-primary font-medium mb-2">Python Example</h4>
                    <pre className="bg-chatgpt-input-bg text-chatgpt-accent-blue p-3 rounded text-sm overflow-x-auto">
                      {`import requests

url = "${typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/api/v1/chat"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "message": "Hello MoonitGPT!"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`}
                    </pre>
                  </CardContent>
                </Card>
                <Card className="bg-chatgpt-message-bg border-chatgpt-border">
                  <CardContent className="p-4">
                    <h4 className="text-chatgpt-text-primary font-medium mb-2">JavaScript Example</h4>
                    <pre className="bg-chatgpt-input-bg text-chatgpt-accent-blue p-3 rounded text-sm overflow-x-auto">
                      {`fetch("${typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/api/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "Hello MoonitGPT!"
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
