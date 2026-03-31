'use client'

import useSWR, { mutate } from 'swr'
import { Cart } from '@/lib/types'
import { getClientSessionId } from '@/lib/client-session'

const fetcher = async (url: string) => {
  const sessionId = getClientSessionId()
  const res = await fetch(url, {
    headers: { 'X-Session-ID': sessionId },
  })
  if (!res.ok) throw new Error('Failed to fetch cart')
  return res.json()
}

export function useCart() {
  const { data, error, isLoading } = useSWR<Cart>('/api/cart/cart', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  return {
    cart: data,
    isLoading,
    error,
    mutate: () => mutate('/api/cart/cart'),
  }
}

export function useCartCount(): number {
  const { cart } = useCart()
  if (!cart?.items) return 0
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export async function refreshCart() {
  return mutate('/api/cart/cart')
}
