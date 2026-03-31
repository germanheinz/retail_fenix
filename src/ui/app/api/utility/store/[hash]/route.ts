import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import os from 'os'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params

  if (!/^[0-9]+$/.test(hash)) {
    return NextResponse.json({ error: 'Invalid hash format' }, { status: 400 })
  }

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
