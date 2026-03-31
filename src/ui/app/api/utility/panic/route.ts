import { NextResponse } from 'next/server'

export async function GET() {
  setTimeout(() => process.exit(1), 500)
  return new NextResponse('Shutting down...', { status: 500 })
}
