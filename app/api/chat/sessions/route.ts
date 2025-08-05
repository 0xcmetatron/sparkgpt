import { type NextRequest, NextResponse } from "next/server"
import { createChatSession, getChatSessions, updateChatSessionName, deleteChatSession } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 })
    }

    const sessions = await getChatSessions(Number.parseInt(userId))
    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Chat sessions fetch error:", error)
    return NextResponse.json({ message: "Failed to fetch chat sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionName } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 })
    }

    const sessionId = await createChatSession(userId, sessionName || "New Chat")

    return NextResponse.json({
      message: "Chat session created successfully",
      sessionId,
    })
  } catch (error) {
    console.error("Chat session creation error:", error)
    return NextResponse.json({ message: "Failed to create chat session" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, sessionName } = await request.json()

    if (!sessionId || !sessionName) {
      return NextResponse.json({ message: "Session ID and name required" }, { status: 400 })
    }

    await updateChatSessionName(sessionId, sessionName)

    return NextResponse.json({
      message: "Chat session updated successfully",
    })
  } catch (error) {
    console.error("Chat session update error:", error)
    return NextResponse.json({ message: "Failed to update chat session" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ message: "Session ID required" }, { status: 400 })
    }

    await deleteChatSession(sessionId)

    return NextResponse.json({
      message: "Chat session deleted successfully",
    })
  } catch (error) {
    console.error("Chat session deletion error:", error)
    return NextResponse.json({ message: "Failed to delete chat session" }, { status: 500 })
  }
}
