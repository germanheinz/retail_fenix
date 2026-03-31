'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { getClientSessionId } from '@/lib/client-session'
import { refreshCart } from '@/hooks/useCart'

export function useAddToCart() {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  async function addToCart(product: Product) {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/cart/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': getClientSessionId(),
        },
        body: JSON.stringify({ id: product.id, quantity: 1 }),
      })
      if (!res.ok) throw new Error()
      await refreshCart()
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
      toast.success('Ticket added', { description: product.name })
    } catch {
      toast.error('Could not add ticket')
    } finally {
      setLoading(false)
    }
  }

  return { loading, added, addToCart }
}
