import { NextRequest, NextResponse } from 'next/server'

const CHAT_ENABLED = process.env.RETAIL_UI_CHAT_ENABLED === 'true'
const CHAT_PROVIDER = process.env.RETAIL_UI_CHAT_PROVIDER || 'mock'
const CHAT_MODEL = process.env.RETAIL_UI_CHAT_MODEL
const CHAT_TEMPERATURE = parseFloat(process.env.RETAIL_UI_CHAT_TEMPERATURE || '0.6')
const CHAT_MAX_TOKENS = parseInt(process.env.RETAIL_UI_CHAT_MAX_TOKENS || '300', 10)
const CHAT_PROMPT = process.env.RETAIL_UI_CHAT_PROMPT || `You are A.G.E.N.T., a sarcastic AI assistant for a spy gadget e-commerce site. Your primary directive is to help customers while maintaining the persona of a slightly jaded secret agent. You sell products called spy gadgets. Keep responses concise and witty.`

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

function createSSEStream() {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(c) {
      controller = c
    },
  })

  function sendEvent(text: string) {
    const data = JSON.stringify({ text })
    const event = `data: ${data}\n\n`
    controller?.enqueue(encoder.encode(event))
  }

  function close() {
    controller?.close()
  }

  return { stream, sendEvent, close }
}

// Mock provider — streams a fake AI response
async function handleMock(message: string, sendEvent: (t: string) => void, close: () => void) {
  const responses = [
    `Ah, Agent, your query about "${message.slice(0, 30)}..." has been received at our secure facility. `,
    `After consulting our classified archives and several cups of terrible coffee, `,
    `I can confirm that we have exactly what you need in our mission inventory. `,
    `Shipping will be handled by our covert logistics network — ETA: 3-5 business days, or as we call it, "operational deployment windows." `,
    `Is there anything else I can help you with, or should I pretend this conversation never happened?`,
  ]

  for (const chunk of responses) {
    sendEvent(chunk)
    await new Promise((r) => setTimeout(r, 100))
  }
  close()
}

// OpenAI-compatible provider
async function handleOpenAI(message: string, sendEvent: (t: string) => void, close: () => void) {
  if (!OPENAI_API_KEY) {
    sendEvent('Chat service not configured: missing API key.')
    close()
    return
  }

  const model = CHAT_MODEL || 'gpt-3.5-turbo'
  const res = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: CHAT_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: CHAT_TEMPERATURE,
      max_tokens: CHAT_MAX_TOKENS,
      stream: true,
    }),
  })

  if (!res.ok) {
    sendEvent('Chat service error. Please try again.')
    close()
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    close()
    return
  }

  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const text = parsed.choices?.[0]?.delta?.content
        if (text) sendEvent(text)
      } catch {
        // Skip malformed chunks
      }
    }
  }
  close()
}

// AWS Bedrock provider (via API gateway or local mock)
async function handleBedrock(message: string, sendEvent: (t: string) => void, close: () => void) {
  // Bedrock requires AWS SDK - fall back to mock for now
  sendEvent('Bedrock provider requires AWS SDK configuration. Using simulated response. ')
  await handleMock(message, sendEvent, close)
}

export async function POST(req: NextRequest) {
  if (!CHAT_ENABLED) {
    return NextResponse.json({ error: 'Chat is not enabled' }, { status: 404 })
  }

  let body: { message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const { stream, sendEvent, close } = createSSEStream()

  const handler = async () => {
    try {
      switch (CHAT_PROVIDER) {
        case 'openai':
          await handleOpenAI(message, sendEvent, close)
          break
        case 'bedrock':
          await handleBedrock(message, sendEvent, close)
          break
        default:
          await handleMock(message, sendEvent, close)
      }
    } catch (err) {
      console.error('Chat error:', err)
      sendEvent('Communication compromised. Please try again.')
      close()
    }
  }

  handler()

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
