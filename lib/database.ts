import mysql from "mysql2/promise"

const dbConfig = {
  host: "31.220.17.137",
  database: "chatgpt",
  user: "streamly",
  password: "Streamly159@",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
}

let pool: mysql.Pool | null = null

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

export async function executeQuery(query: string, params: any[] = []) {
  const connection = getPool()
  try {
    const [results] = await connection.execute(query, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    console.error("Query:", query)
    console.error("Params:", params)
    throw error
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await executeQuery("SELECT 1 as test")
    console.log("Database connection successful:", result)
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// User functions
export async function createUser(username: string, email: string, passwordHash: string) {
  const query = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
  return executeQuery(query, [username, email, passwordHash])
}

export async function getUserByEmail(email: string) {
  const query = "SELECT * FROM users WHERE email = ?"
  const results = (await executeQuery(query, [email])) as any[]
  return results[0] || null
}

export async function getUserById(id: number) {
  const query = "SELECT * FROM users WHERE id = ?"
  const results = (await executeQuery(query, [id])) as any[]
  return results[0] || null
}

// Chat session functions
export async function createChatSession(userId: number, sessionName = "New Chat") {
  const query = "INSERT INTO chat_sessions (user_id, session_name) VALUES (?, ?)"
  const result = (await executeQuery(query, [userId, sessionName])) as any
  return result.insertId
}

export async function getChatSessions(userId: number) {
  const query = "SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC"
  return executeQuery(query, [userId])
}

export async function updateChatSessionName(sessionId: number, newName: string) {
  const query = "UPDATE chat_sessions SET session_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  return executeQuery(query, [newName, sessionId])
}

export async function deleteChatSession(sessionId: number) {
  const query = "DELETE FROM chat_sessions WHERE id = ?"
  return executeQuery(query, [sessionId])
}

// Chat history functions
export async function saveChatMessage(
  userId: number,
  sessionId: number,
  messageId: string,
  content: string,
  role: "user" | "assistant",
) {
  const query = "INSERT INTO chat_history (user_id, session_id, message_id, content, role) VALUES (?, ?, ?, ?, ?)"
  return executeQuery(query, [userId, sessionId, messageId, content, role])
}

export async function getChatHistory(sessionId: number, limit = 50) {
  const query = "SELECT * FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC LIMIT ?"
  return executeQuery(query, [sessionId, limit])
}

// API key functions - COMPLETAMENTE CORREGIDO
export async function createApiKey(userId: number, name: string, apiKey: string) {
  try {
    console.log("=== Creating API Key ===")
    console.log("User ID:", userId)
    console.log("Name:", name)
    console.log("API Key length:", apiKey.length)
    console.log("API Key preview:", apiKey.substring(0, 10) + "...")

    // Verificar que el usuario existe
    const user = await getUserById(userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }
    console.log("User verified:", user.username)

    // Verificar que la API key no existe
    const existingKey = await getApiKey(apiKey)
    if (existingKey) {
      throw new Error("API key already exists")
    }

    const query = "INSERT INTO api_keys (user_id, api_key, name) VALUES (?, ?, ?)"
    console.log("Executing query:", query)
    console.log("With params:", [userId, "***", name])

    const result = (await executeQuery(query, [userId, apiKey, name])) as any
    console.log("Insert result:", result)

    if (!result.insertId) {
      throw new Error("Failed to get insert ID")
    }

    console.log("API key created successfully with ID:", result.insertId)
    return result.insertId
  } catch (error) {
    console.error("=== API Key Creation Error ===")
    console.error("Error details:", error)
    throw error
  }
}

export async function getApiKey(apiKey: string) {
  const query = "SELECT * FROM api_keys WHERE api_key = ? AND is_active = TRUE"
  const results = (await executeQuery(query, [apiKey])) as any[]
  return results[0] || null
}

export async function getUserApiKeys(userId: number) {
  const query = "SELECT * FROM api_keys WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC"
  return executeQuery(query, [userId])
}

export async function updateApiKeyUsage(apiKey: string, creditsUsed: number) {
  const query = "UPDATE api_keys SET credits_used = ? WHERE api_key = ?"
  return executeQuery(query, [creditsUsed, apiKey])
}

export async function resetApiKeyCredits(apiKey: string) {
  const query = "UPDATE api_keys SET credits_used = 0, last_reset = CURRENT_TIMESTAMP WHERE api_key = ?"
  return executeQuery(query, [apiKey])
}
