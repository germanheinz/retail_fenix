import { NextRequest, NextResponse } from 'next/server'

const CHECKOUT_URL = process.env.RETAIL_UI_ENDPOINTS_CHECKOUT

type RouteContext = { params: Promise<{ path: string[] }> }

async function proxyRequest(req: NextRequest, context: RouteContext) {
  const params = await context.params
  const path = params.path?.join('/') ?? ''
  const searchParams = req.nextUrl.searchParams.toString()
  const targetUrl = `${CHECKOUT_URL}/${path}${searchParams ? `?${searchParams}` : ''}`

  if (!CHECKOUT_URL) {
    return NextResponse.json({ error: 'Checkout service not configured' }, { status: 503 })
  }

  try {
    const headers = new Headers()
    const sessionId = req.headers.get('X-Session-ID')
    if (sessionId) headers.set('X-Session-ID', sessionId)
    const contentType = req.headers.get('Content-Type')
    if (contentType) headers.set('Content-Type', contentType)

    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.text()
      : undefined

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    })

    const responseBody = await res.text()
    return new NextResponse(responseBody, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (err) {
    console.error('Checkout proxy error:', err)
    return NextResponse.json({ error: 'Checkout service unavailable' }, { status: 503 })
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context)
}

export async function POST(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context)
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context)
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context)
}
