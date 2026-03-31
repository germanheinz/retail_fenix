import type { Cart } from '@/lib/types'

const API_BASE = '/api/cart'

export async function getCart(sessionId: string): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart`, {
    headers: { 'X-Session-ID': sessionId },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch cart: ${res.status}`)
  }

  return res.json()
}

export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number = 1
): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ id: productId, quantity }),
  })

  if (!res.ok) {
    throw new Error(`Failed to add to cart: ${res.status}`)
  }

  return res.json()
}

export async function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ quantity }),
  })

  if (!res.ok) {
    throw new Error(`Failed to update cart item: ${res.status}`)
  }

  return res.json()
}

export async function removeFromCart(sessionId: string, itemId: string): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'X-Session-ID': sessionId },
  })

  if (!res.ok) {
    throw new Error(`Failed to remove from cart: ${res.status}`)
  }

  return res.json()
}
