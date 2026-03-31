import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join } from 'path'
import os from 'os'

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash
}

export async function POST(req: NextRequest) {
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
