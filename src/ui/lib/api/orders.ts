import type { Order } from '@/lib/types'

const API_BASE = '/api/orders'

export async function getOrders(sessionId: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: { 'X-Session-ID': sessionId },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.status}`)
  }

  return res.json()
}

export async function getOrder(sessionId: string, orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { 'X-Session-ID': sessionId },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch order: ${res.status}`)
  }

  return res.json()
}
