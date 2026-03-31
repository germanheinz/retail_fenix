import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
