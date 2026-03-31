'use client'

import { Loader2, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'
import { useAddToCart } from '@/hooks/useAddToCart'

interface AddToCartButtonProps {
  product: Product
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { loading, addToCart } = useAddToCart()

  return (
    <Button
      onClick={() => addToCart(product)}
      disabled={loading}
      size="lg"
      className="w-full gap-2"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ticket className="w-5 h-5" />}
      {loading ? 'Adding...' : 'Get Tickets'}
    </Button>
  )
}
