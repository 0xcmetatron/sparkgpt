import { type NextRequest, NextResponse } from "next/server"
import { getChatHistory } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ message: "Session ID required" }, { status: 400 })
    }

    const history = await getChatHistory(Number.parseInt(sessionId), 50)
    return NextResponse.json(history)
  } catch (error) {
    console.error("Chat history error:", error)
    return NextResponse.json({ message: "Failed to fetch chat history" }, { status: 500 })
  }
}
