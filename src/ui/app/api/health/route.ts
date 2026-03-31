import { NextResponse } from 'next/server'

let healthState = true

export function GET() {
  if (!healthState) {
    return NextResponse.json(
      {
        status: 'DOWN',
        components: {
          ui: { status: 'DOWN' },
        },
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    status: 'UP',
    components: {
      ui: { status: 'UP' },
    },
  })
}

// Allow toggling health for testing
export function POST(req: Request) {
  const url = new URL(req.url)
  const path = url.pathname

  if (path.includes('/up')) {
    healthState = true
    return NextResponse.json({ status: 'Health set to UP' })
  } else if (path.includes('/down')) {
    healthState = false
    return NextResponse.json({ status: 'Health set to DOWN' })
  }

  return NextResponse.json({ error: 'Unknown health action' }, { status: 400 })
}
