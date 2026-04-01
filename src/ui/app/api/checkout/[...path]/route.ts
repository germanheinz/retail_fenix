import { NextRequest, NextResponse } from 'next/server'

const CHECKOUT_URL = process.env.RETAIL_UI_ENDPOINTS_CHECKOUT
const CARTS_URL = process.env.RETAIL_UI_ENDPOINTS_CARTS

type RouteContext = { params: Promise<{ path: string[] }> }

type CartItem = { itemId: string; quantity: number; unitPrice: number }
type CheckoutItem = { id: string; name: string; quantity: number; price: number; totalCost?: number }
type RawCheckout = {
  items?: CheckoutItem[]
  shippingAddress?: unknown
  shippingRates?: { rates?: ShippingRate[] }
  subtotal?: number
  shipping?: number
  tax?: number
  total?: number
}
type ShippingRate = { token: string; name: string; amount: number; estimatedDays: number }

function transformCheckoutResponse(data: RawCheckout) {
  const { shippingRates, ...rest } = data
  return { ...rest, shippingOptions: shippingRates?.rates ?? [] }
}

async function fetchCartItems(sessionId: string): Promise<CheckoutItem[]> {
  if (!CARTS_URL) return []
  try {
    const res = await fetch(`${CARTS_URL}/carts/${sessionId}`)
    if (!res.ok) return []
    const data = await res.json() as { items?: CartItem[] }
    return (data.items ?? []).map((item) => ({
      id: item.itemId,
      name: item.itemId,
      quantity: item.quantity,
      price: item.unitPrice,
    }))
  } catch {
    return []
  }
}

async function getCurrentCheckout(sessionId: string): Promise<RawCheckout | null> {
  try {
    const res = await fetch(`${CHECKOUT_URL}/checkout/${sessionId}`)
    if (!res.ok) return null
    return await res.json() as RawCheckout
  } catch {
    return null
  }
}

async function proxyRequest(req: NextRequest, context: RouteContext) {
  if (!CHECKOUT_URL) {
    return NextResponse.json({ error: 'Checkout service not configured' }, { status: 503 })
  }

  const params = await context.params
  const path = params.path ?? []
  const sessionId = req.headers.get('X-Session-ID')

  if (!sessionId) {
    return NextResponse.json({ error: 'No session ID' }, { status: 400 })
  }

  const method = req.method

  // GET /api/checkout/checkout → GET /checkout/{sessionId}
  if (method === 'GET' && path.length === 1 && path[0] === 'checkout') {
    try {
      const res = await fetch(`${CHECKOUT_URL}/checkout/${sessionId}`)
      if (res.status === 404) {
        return NextResponse.json({ items: [], shippingOptions: [] }, { status: 200 })
      }
      const data = await res.json() as RawCheckout
      return NextResponse.json(transformCheckoutResponse(data), { status: res.status })
    } catch (err) {
      console.error('Checkout GET error:', err)
      return NextResponse.json({ error: 'Checkout service unavailable' }, { status: 503 })
    }
  }

  // POST /api/checkout/checkout/shipping → fetch cart items + POST /checkout/{sessionId}/update
  if (method === 'POST' && path[0] === 'checkout' && path[1] === 'shipping') {
    try {
      const shippingAddress = await req.json()
      const items = await fetchCartItems(sessionId)
      const res = await fetch(`${CHECKOUT_URL}/checkout/${sessionId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress }),
      })
      const data = await res.json() as RawCheckout
      return NextResponse.json(transformCheckoutResponse(data), { status: res.status })
    } catch (err) {
      console.error('Checkout shipping error:', err)
      return NextResponse.json({ error: 'Checkout service unavailable' }, { status: 503 })
    }
  }

  // POST /api/checkout/checkout/delivery → fetch current state + POST /checkout/{sessionId}/update
  if (method === 'POST' && path[0] === 'checkout' && path[1] === 'delivery') {
    try {
      const { token } = await req.json() as { token: string }
      const current = await getCurrentCheckout(sessionId)
      const items = (current?.items ?? []).map(({ id, name, quantity, price }) => ({ id, name, quantity, price }))
      const shippingAddress = current?.shippingAddress ?? null
      const res = await fetch(`${CHECKOUT_URL}/checkout/${sessionId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress, deliveryOptionToken: token }),
      })
      const data = await res.json() as RawCheckout
      return NextResponse.json(transformCheckoutResponse(data), { status: res.status })
    } catch (err) {
      console.error('Checkout delivery error:', err)
      return NextResponse.json({ error: 'Checkout service unavailable' }, { status: 503 })
    }
  }

  // POST /api/checkout/checkout/submit → POST /checkout/{sessionId}/submit
  if (method === 'POST' && path[0] === 'checkout' && path[1] === 'submit') {
    try {
      const res = await fetch(`${CHECKOUT_URL}/checkout/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const responseBody = await res.text()
      return new NextResponse(responseBody, {
        status: res.status,
        headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
      })
    } catch (err) {
      console.error('Checkout submit error:', err)
      return NextResponse.json({ error: 'Checkout service unavailable' }, { status: 503 })
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
