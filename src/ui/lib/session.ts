'use server'

import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

const SESSION_COOKIE_NAME = 'session-id'

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
  }

  return sessionId
}

export function getSessionIdFromCookieHeader(cookieHeader: string | null): string {
  if (!cookieHeader) return uuidv4()
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : uuidv4()
}
