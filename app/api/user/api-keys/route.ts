import { type NextRequest, NextResponse } from "next/server"
import { createApiKey, getUserApiKeys, testConnection } from "@/lib/database"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 })
    }

    const apiKeys = await getUserApiKeys(Number.parseInt(userId))
    return NextResponse.json(apiKeys)
  } catch (error) {
    console.error("API keys fetch error:", error)
    return NextResponse.json({ message: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== API Key Creation Request ===")

    // Test database connection first
    const connectionOk = await testConnection()
    if (!connectionOk) {
      throw new Error("Database connection failed")
    }

    const body = await request.json()
    const { userId, name } = body

    console.log("Request body:", { userId, name })

    // Validar datos de entrada
    if (!userId || !name) {
      console.log("Missing required fields")
      return NextResponse.json({ message: "User ID and name are required" }, { status: 400 })
    }

    if (typeof userId !== "number" || typeof name !== "string") {
      console.log("Invalid data types")
      return NextResponse.json({ message: "Invalid data types" }, { status: 400 })
    }

    if (name.trim().length === 0) {
      console.log("Empty name provided")
      return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 })
    }

    // Generate API key - CORREGIDO: más corto para evitar problemas
    const randomPart = randomBytes(24).toString("hex") // 48 caracteres
    const apiKey = `ck_${randomPart}` // Total: 51 caracteres (cabe en VARCHAR(128))

    console.log("Generated API key length:", apiKey.length)

    // Create API key in database
    const insertId = await createApiKey(userId, name.trim(), apiKey)
    console.log("API key created successfully with ID:", insertId)

    return NextResponse.json({
      message: "API key created successfully",
      success: true,
      id: insertId,
    })
  } catch (error) {
    console.error("=== API Key Creation Route Error ===")
    console.error("Error:", error)

    let errorMessage = "Failed to create API key"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        message: "Failed to create API key",
        error: errorMessage,
        success: false,
      },
      { status: 500 },
    )
  }
}
