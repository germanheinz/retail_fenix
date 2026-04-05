import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS, MOCK_TAGS } from '@/lib/mock/data'

const CATALOG_URL = process.env.RETAIL_UI_ENDPOINTS_CATALOG

type RouteContext = { params: Promise<{ path: string[] }> }

function handleMock(path: string[], searchParams: URLSearchParams): NextResponse {
  // GET /catalog/tags
  if (path[0] === 'tags') {
    return NextResponse.json(MOCK_TAGS)
  }

  // GET /catalog/size
  if (path[0] === 'size') {
    const tag = searchParams.get('tag') || ''
    const filtered = tag
      ? MOCK_PRODUCTS.filter(p => p.tags.some(t => t.name === tag))
      : MOCK_PRODUCTS
    return NextResponse.json({ size: filtered.length })
  }

  // GET /catalog/products/:id
  if (path[0] === 'products' && path[1]) {
    const product = MOCK_PRODUCTS.find(p => p.id === path[1])
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
  }

  // GET /catalog/products
  if (path[0] === 'products') {
    const tag = searchParams.get('tag') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '6')

    let filtered = tag
      ? MOCK_PRODUCTS.filter(p => p.tags.some(t => t.name === tag))
      : MOCK_PRODUCTS

    const start = (page - 1) * size
    const paginated = filtered.slice(start, start + size)

    return NextResponse.json({
      page,
      size: paginated.length,
      totalSize: filtered.length,
      products: paginated,
    })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

async function proxyRequest(req: NextRequest, context: RouteContext) {
  const params = await context.params
  const path = params.path ?? []
  const searchParams = req.nextUrl.searchParams

  // Use mock data when no backend is configured
  if (!CATALOG_URL) {
    return handleMock(path, searchParams)
  }

  const targetUrl = `${CATALOG_URL}/catalog/${path.join('/')}${searchParams.toString() ? `?${searchParams}` : ''}`

  try {
    const headers = new Headers()
    if (req.headers.get('X-Session-ID')) {
      headers.set('X-Session-ID', req.headers.get('X-Session-ID')!)
    }
    if (req.headers.get('Content-Type')) {
      headers.set('Content-Type', req.headers.get('Content-Type')!)
    }

    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined

    const res = await fetch(targetUrl, { method: req.method, headers, body })
    const contentType = res.headers.get('Content-Type') || 'application/json'

    // Normalize plain array response from /catalog/products into ProductPage format
    if (res.ok && path[0] === 'products' && !path[1]) {
      const data = await res.json()
      if (Array.isArray(data)) {
        const page = parseInt(searchParams.get('page') || '1')
        const size = parseInt(searchParams.get('size') || '6')
        const normalized = { page, size: data.length, totalSize: data.length, totalPages: 1, products: data }
        return NextResponse.json(normalized)
      }
      return NextResponse.json(data, { status: res.status })
    }

    const responseBody = await res.text()
    return new NextResponse(responseBody, {
      status: res.status,
      headers: { 'Content-Type': contentType },
    })
  } catch (err) {
    console.error('Catalog proxy error, falling back to mock:', err)
    return handleMock(path, searchParams)
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
