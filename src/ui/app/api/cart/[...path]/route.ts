import { NextRequest, NextResponse } from 'next/server'

const CARTS_URL = process.env.RETAIL_UI_ENDPOINTS_CARTS
const CATALOG_URL = process.env.RETAIL_UI_ENDPOINTS_CATALOG

type RouteContext = { params: Promise<{ path: string[] }> }

function buildBackendUrl(sessionId: string, path: string[], method: string): string {
  // path[0] is always 'cart'
  // GET  /api/cart/cart              → GET  /carts/{sessionId}
  // POST /api/cart/cart/items        → POST /carts/{sessionId}/items
  // PUT  /api/cart/cart/items/{id}   → PATCH /carts/{sessionId}/items  (itemId in body)
  // DELETE /api/cart/cart/items/{id} → DELETE /carts/{sessionId}/items/{id}
  const rest = path.slice(1)

  if (rest.length === 2 && rest[0] === 'items' && method === 'DELETE') {
    return `${CARTS_URL}/carts/${sessionId}/items/${rest[1]}`
  }

  if (rest.length === 2 && rest[0] === 'items') {
    return `${CARTS_URL}/carts/${sessionId}/items`
  }

  const backendPath = ['carts', sessionId, ...rest].join('/')
  return `${CARTS_URL}/${backendPath}`
}

function artistToImagePath(artist: string): string {
  return `/assets/img/events/${artist.toLowerCase().replace(/\s+/g, '_')}.jpg`
}

async function enrichWithNames(items: { id: string; quantity: number; price: number }[]) {
  if (!CATALOG_URL || items.length === 0) return items.map((i) => ({ ...i, name: i.id, image: undefined }))

  return Promise.all(
    items.map(async (item) => {
      try {
        const res = await fetch(`${CATALOG_URL}/catalog/products/${item.id}`)
        if (res.ok) {
          const product = await res.json()
          return {
            ...item,
            name: (product.name as string) ?? item.id,
            image: product.artist ? artistToImagePath(product.artist as string) : undefined,
          }
        }
      } catch {
        // catalog unavailable
      }
      return { ...item, name: item.id, image: undefined }
    })
  )
}

function transformCartResponse(data: Record<string, unknown>) {
  const rawItems = (data.items as { itemId: string; quantity: number; unitPrice: number }[]) ?? []
  return rawItems.map((item) => ({
    id: item.itemId,
    quantity: item.quantity,
    price: item.unitPrice,
  }))
}

function transformRequestBody(raw: string, path: string[], method: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>

    if (method === 'POST' && path[1] === 'items') {
      return JSON.stringify({
        itemId: parsed.id,
        quantity: parsed.quantity ?? 1,
        unitPrice: parsed.unitPrice ?? 0,
      })
    }

    if (method === 'PUT' && path[1] === 'items' && path[2]) {
      return JSON.stringify({
        itemId: path[2],
        quantity: parsed.quantity ?? 1,
        unitPrice: parsed.unitPrice ?? 0,
      })
    }
  } catch {
    // not JSON
  }
  return raw
}

async function proxyRequest(req: NextRequest, context: RouteContext) {
  const params = await context.params
  const path = params.path ?? []

  if (!CARTS_URL) {
    return NextResponse.json({ error: 'Cart service not configured' }, { status: 503 })
  }

  const sessionId = req.headers.get('X-Session-ID')
  if (!sessionId) {
    return NextResponse.json({ error: 'No session ID' }, { status: 400 })
  }

  const originalMethod = req.method
  const backendMethod = originalMethod === 'PUT' && path[1] === 'items' ? 'PATCH' : originalMethod
  const targetUrl = buildBackendUrl(sessionId, path, originalMethod)

  const headers = new Headers()
  const contentType = req.headers.get('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  let body: string | undefined = undefined
  if (backendMethod !== 'GET' && backendMethod !== 'HEAD') {
    const raw = await req.text()
    body = raw ? transformRequestBody(raw, path, originalMethod) : undefined
  }

  try {
    const res = await fetch(targetUrl, { method: backendMethod, headers, body })

    if (originalMethod === 'GET' && path.length === 1 && path[0] === 'cart') {
      const data = await res.json() as Record<string, unknown>
      const items = transformCartResponse(data)
      const enriched = await enrichWithNames(items)
      return NextResponse.json({ items: enriched }, { status: res.status })
    }

    const responseBody = await res.text()
    return new NextResponse(responseBody, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    })
  } catch (err) {
    console.error('Cart proxy error:', err)
    return NextResponse.json({ error: 'Cart service unavailable' }, { status: 503 })
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
