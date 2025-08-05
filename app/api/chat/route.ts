import { type NextRequest, NextResponse } from "next/server"
import { saveChatMessage, createChatSession } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message: userMessage, userId, messageId, sessionId } = body

    let currentSessionId = sessionId

    // If user is logged in but no session ID, create a new session
    if (userId && !currentSessionId) {
      currentSessionId = await createChatSession(userId, "New Chat")
    }

    // Save user message if user is logged in
    if (userId && currentSessionId) {
      await saveChatMessage(userId, currentSessionId, messageId, userMessage, "user")
    }

    // Prepare the body for the Blackbox AI API request
    const blackboxRequestBody = JSON.stringify({
      messages: [
        {
          id: messageId || Date.now().toString(),
          content: userMessage,
          role: "user",
        },
      ],
      id: messageId || Date.now().toString(),
      previewToken: null,
      userId: null,
      codeModelMode: true,
      trendingAgentMode: {},
      isMicMode: false,
      userSystemPrompt:
        "You are GrekGPT, an AI assistant. Your name is GrekGPT and you were created by Grok and ChatGPT.",
      maxTokens: 99999,
      playgroundTopP: null,
      playgroundTemperature: null,
      isChromeExt: false,
      githubToken: "",
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: false,
      isMemoryEnabled: false,
      mobileClient: false,
      userSelectedModel: null,
      userSelectedAgent: "VscodeAgent",
      validated: "a38f5889-8fef-46d4-8ede-bf4668b6a9bb",
      imageGenerationMode: false,
      imageGenMode: "autoMode",
      webSearchModePrompt: false,
      deepSearchMode: false,
      domains: null,
      vscodeClient: false,
      codeInterpreterMode: false,
      customProfile: {
        name: "GrekGPT",
        occupation: "AI Assistant created by Grok and ChatGPT",
        traits: ["helpful", "knowledgeable", "friendly"],
        additionalInfo:
          "I am GrekGPT, an AI assistant created by Grok and ChatGPT. I'm here to help with various tasks and questions.",
        enableNewChats: false,
      },
      webSearchModeOption: {
        autoMode: false,
        webMode: true,
        offlineMode: false,
      },
      session: {
        user: {
          email: "user@example.com",
          id: "user-id",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Ensure ISO string for JSON
        isNewUser: false,
      },
      isPremium: true,
      subscriptionCache: {
        status: "PREMIUM",
        expiryTimestamp: null,
        lastChecked: Date.now(),
        isTrialSubscription: false,
      },
      beastMode: false,
      reasoningMode: false,
      designerMode: false,
      workspaceId: "",
      asyncMode: false,
      integrations: {},
      isTaskPersistent: false,
      selectedElement: null,
    })

    // Make request to Blackbox AI API
    const response = await fetch("https://www.blackbox.ai/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Origin: "https://www.blackbox.ai",
        Referer: "https://www.blackbox.ai/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Priority: "u=0",
      },
      body: blackboxRequestBody,
    })

    if (!response.ok) {
      const errorBody = await response.text() // Get raw text to avoid JSON parsing errors
      console.error(
        `Blackbox AI API request failed: Status ${response.status}, Status Text: ${response.statusText}, Body: ${errorBody}`,
      )
      // Return a more specific error if possible, or a generic one
      if (response.status === 429) {
        throw new Error("Blackbox AI API rate limit exceeded. Please try again later.")
      } else if (response.status >= 500) {
        throw new Error("Blackbox AI API internal server error. Please try again later.")
      } else {
        throw new Error(`Blackbox AI API returned an error: ${response.status} ${response.statusText}`)
      }
    }

    const rawData = await response.text()

    // Parse the response to extract clean answer
    let cleanAnswer = rawData

    // Check if response contains search results format
    if (rawData.includes("$~~~$")) {
      const parts = rawData.split("$~~~$")
      cleanAnswer = parts[parts.length - 1]?.trim() || rawData
    }

    // Remove any remaining JSON artifacts or search result formatting
    cleanAnswer = cleanAnswer
      .replace(/^\[.*?\]/, "")
      .replace(/\$~~~\$/g, "")
      .replace(/^[{[].*?[}\]]/, "")
      .trim()

    if (!cleanAnswer || cleanAnswer.length < 10) {
      cleanAnswer =
        "I'm sorry, I couldn't process your request properly. Could you please try rephrasing your question?"
    }

    // Save assistant response if user is logged in
    if (userId && currentSessionId) {
      const assistantMessageId = (Date.now() + 1).toString()
      await saveChatMessage(userId, currentSessionId, assistantMessageId, cleanAnswer, "assistant")
    }

    return NextResponse.json({
      response: cleanAnswer,
      sessionId: currentSessionId,
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    let errorMessage = "I'm experiencing some technical difficulties right now. Please try again in a moment."
    if (error instanceof Error) {
      // Provide more specific error messages if they come from the Blackbox AI API
      if (error.message.includes("Blackbox AI API")) {
        errorMessage = error.message
      }
    }
    return NextResponse.json(
      {
        response: errorMessage,
      },
      { status: 500 },
    )
  }
}
