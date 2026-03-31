import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const headers: Record<string, string[]> = {}
  req.headers.forEach((value, key) => {
    headers[key] = [value]
  })
  return NextResponse.json(headers)
}
