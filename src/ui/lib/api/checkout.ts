import type { Checkout, CheckoutSubmitted, ShippingAddress } from '@/lib/types'

const API_BASE = '/api/checkout'

export async function createCheckout(sessionId: string): Promise<Checkout> {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to create checkout: ${res.status}`)
  }

  return res.json()
}

export async function getCheckout(sessionId: string): Promise<Checkout> {
  const res = await fetch(`${API_BASE}/checkout`, {
    headers: { 'X-Session-ID': sessionId },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to get checkout: ${res.status}`)
  }

  return res.json()
}

export async function updateShipping(
  sessionId: string,
  address: ShippingAddress
): Promise<Checkout> {
  const res = await fetch(`${API_BASE}/checkout/shipping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify(address),
  })

  if (!res.ok) {
    throw new Error(`Failed to update shipping: ${res.status}`)
  }

  return res.json()
}

export async function updateDelivery(
  sessionId: string,
  shippingToken: string
): Promise<Checkout> {
  const res = await fetch(`${API_BASE}/checkout/delivery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ token: shippingToken }),
  })

  if (!res.ok) {
    throw new Error(`Failed to update delivery: ${res.status}`)
  }

  return res.json()
}

export async function submitCheckout(sessionId: string): Promise<CheckoutSubmitted> {
  const res = await fetch(`${API_BASE}/checkout/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to submit checkout: ${res.status}`)
  }

  return res.json()
}
