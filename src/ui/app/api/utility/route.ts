import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import os from 'os'

// GET /api/utility?action=stress&iterations=1000
// GET /api/utility?action=status&code=200
// GET /api/utility?action=headers
// POST /api/utility?action=echo
// POST /api/utility?action=store
// GET /api/utility?action=store&hash=12345

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || url.pathname.split('/').pop()

  // /api/utility/stress/{iterations}
  if (url.pathname.includes('/stress/')) {
    const iterations = parseInt(url.pathname.split('/stress/')[1], 10) || 1000
    const result = monteCarloPi(iterations)
    return NextResponse.json(result)
  }

  // /api/utility/status/{code}
  if (url.pathname.includes('/status/')) {
    const code = parseInt(url.pathname.split('/status/')[1], 10) || 200
    return new NextResponse('OK', { status: code })
  }

  // /api/utility/headers
  if (action === 'headers' || url.pathname.includes('/headers')) {
    const headers: Record<string, string[]> = {}
    req.headers.forEach((value, key) => {
      headers[key] = [value]
    })
    return NextResponse.json(headers)
  }

  // /api/utility/store/{hash}
  const storeMatch = url.pathname.match(/\/store\/([0-9]+)$/)
  if (storeMatch) {
    const hash = storeMatch[1]
    try {
      const filePath = join(os.tmpdir(), `${hash}.json`)
      const content = readFileSync(filePath, 'utf-8')
      return new NextResponse(content, {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  }

  return NextResponse.json({ error: 'Unknown utility action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)

  // /api/utility/echo
  if (url.pathname.includes('/echo')) {
    const body = await req.text()
    return new NextResponse(body, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // /api/utility/store
  if (url.pathname.includes('/store')) {
    const body = await req.text()
    const hash = String(Math.abs(hashCode(body)))
    try {
      const filePath = join(os.tmpdir(), `${hash}.json`)
      writeFileSync(filePath, body)
      return NextResponse.json({ hash })
    } catch {
      return NextResponse.json({ error: 'Failed to write file' }, { status: 500 })
    }
  }

  // /api/utility/health/up or /down
  if (url.pathname.includes('/health/up')) {
    return NextResponse.json({ status: 'Health set to UP' })
  }
  if (url.pathname.includes('/health/down')) {
    return NextResponse.json({ status: 'Health set to DOWN' })
  }

  // /api/utility/panic
  if (url.pathname.includes('/panic')) {
    setTimeout(() => process.exit(1), 500)
    return new NextResponse('Shutting down...', { status: 500 })
  }

  return NextResponse.json({ error: 'Unknown utility action' }, { status: 400 })
}

function monteCarloPi(iterations: number): number {
  let inside = 0
  for (let i = 0; i < iterations; i++) {
    const x = Math.random()
    const y = Math.random()
    if (Math.sqrt(x * x + y * y) < 1.0) inside++
  }
  return (4.0 * inside) / iterations
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash
}
