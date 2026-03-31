import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const statusCode = parseInt(code, 10) || 200
  return new NextResponse('OK', { status: statusCode })
}
