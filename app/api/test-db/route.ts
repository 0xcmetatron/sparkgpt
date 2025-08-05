import { type NextRequest, NextResponse } from "next/server"
import { testConnection, executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...")

    // Test basic connection
    const connectionOk = await testConnection()
    if (!connectionOk) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Test tables exist
    const tables = await executeQuery("SHOW TABLES")
    console.log("Tables found:", tables)

    // Test api_keys table structure
    const apiKeysStructure = await executeQuery("DESCRIBE api_keys")
    console.log("API keys table structure:", apiKeysStructure)

    // Test users count
    const usersCount = await executeQuery("SELECT COUNT(*) as count FROM users")
    console.log("Users count:", usersCount)

    return NextResponse.json({
      success: true,
      connection: "OK",
      tables: tables,
      apiKeysStructure: apiKeysStructure,
      usersCount: usersCount,
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
