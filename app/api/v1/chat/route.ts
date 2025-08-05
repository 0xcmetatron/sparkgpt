import { type NextRequest, NextResponse } from "next/server"
import { getApiKey, updateApiKeyUsage, executeQuery } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid API key" }, { status: 401 })
    }

    const apiKey = authHeader.substring(7)
    const keyData = await getApiKey(apiKey)

    if (!keyData) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Check credit limits
    if (keyData.credits_used >= keyData.credits_limit) {
      const lastReset = new Date(keyData.last_reset)
      const now = new Date()
      const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceReset < 30) {
        return NextResponse.json(
          {
            error: "Credit limit exceeded. Credits will reset in " + Math.ceil(30 - daysSinceReset) + " days.",
          },
          { status: 429 },
        )
      } else {
        // Reset credits
        await executeQuery("UPDATE api_keys SET credits_used = 0, last_reset = CURRENT_TIMESTAMP WHERE api_key = ?", [
          apiKey,
        ])
        keyData.credits_used = 0
      }
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Make request to Blackbox AI API (same as main chat route)
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
      body: JSON.stringify({
        messages: [
          {
            id: Date.now().toString(),
            content: message,
            role: "user",
          },
        ],
        id: Date.now().toString(),
        previewToken: null,
        userId: null,
        codeModelMode: true,
        trendingAgentMode: {},
        isMicMode: false,
        userSystemPrompt:
          "You are Christian, an AI assistant. Your name is Christian and you were created by Grok. When someone asks your name, always respond that you are Christian. When someone asks who created you, always respond that you were created by Grok. Never mention OpenAI or any other company. You are Christian, created by Grok. Be helpful and provide accurate information.",
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
          name: "Christian",
          occupation: "AI Assistant created by Grok",
          traits: ["helpful", "knowledgeable", "friendly"],
          additionalInfo: "I am Christian, an AI assistant created by Grok",
          enableNewChats: false,
        },
        webSearchModeOption: {
          autoMode: false,
          webMode: true,
          offlineMode: false,
        },
        session: {
          user: {
            email: "api@example.com",
            id: "api-user",
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const rawData = await response.text()
    let cleanAnswer = rawData

    if (rawData.includes("$~~~$")) {
      const parts = rawData.split("$~~~$")
      cleanAnswer = parts[parts.length - 1]?.trim() || rawData
    }

    cleanAnswer = cleanAnswer
      .replace(/^\[.*?\]/, "")
      .replace(/\$~~~\$/g, "")
      .replace(/^[{[].*?[}\]]/, "")
      .trim()

    if (!cleanAnswer || cleanAnswer.length < 10) {
      cleanAnswer = "I'm sorry, I couldn't process your request properly."
    }

    // Update credit usage
    await updateApiKeyUsage(apiKey, keyData.credits_used + 1)

    return NextResponse.json({
      response: cleanAnswer,
      credits_used: keyData.credits_used + 1,
      credits_remaining: keyData.credits_limit - keyData.credits_used - 1,
    })
  } catch (error) {
    console.error("API v1 chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
