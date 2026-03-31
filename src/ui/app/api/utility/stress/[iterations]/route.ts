import { NextRequest, NextResponse } from 'next/server'

function monteCarloPi(iterations: number): number {
  let inside = 0
  for (let i = 0; i < iterations; i++) {
    const x = Math.random()
    const y = Math.random()
    if (Math.sqrt(x * x + y * y) < 1.0) inside++
  }
  return (4.0 * inside) / iterations
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ iterations: string }> }
) {
  const { iterations } = await params
  const n = parseInt(iterations, 10) || 1000
  const result = monteCarloPi(n)
  return NextResponse.json(result)
}
