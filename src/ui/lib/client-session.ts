'use client'

import { v4 as uuidv4 } from 'uuid'

const SESSION_COOKIE_NAME = 'session-id'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

function setCookie(name: string, value: string, days: number = 30) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

export function getClientSessionId(): string {
  let sessionId = getCookie(SESSION_COOKIE_NAME)
  if (!sessionId) {
    sessionId = uuidv4()
    setCookie(SESSION_COOKIE_NAME, sessionId)
  }
  return sessionId
}
