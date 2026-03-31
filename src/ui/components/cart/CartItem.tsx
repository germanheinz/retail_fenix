'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { CartItem as CartItemType } from '@/lib/types'
import { getClientSessionId } from '@/lib/client-session'
import { refreshCart } from '@/hooks/useCart'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  async function updateQuantity(newQuantity: number) {
    const sessionId = getClientSessionId()
    try {
      if (newQuantity <= 0) {
        await remove()
        return
      }
      const res = await fetch(`/api/cart/cart/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })
      if (!res.ok) throw new Error('Failed to update cart')
      await refreshCart()
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  async function remove() {
    const sessionId = getClientSessionId()
    try {
      const res = await fetch(`/api/cart/cart/items/${item.id}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionId },
      })
      if (!res.ok) throw new Error('Failed to remove item')
      await refreshCart()
      toast.success(`${item.name} removed from cart`)
    } catch {
      toast.error('Failed to remove item')
    }
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Product Image */}
      <Link href={`/catalog/${item.id}`} className="flex-shrink-0">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50">
          <Image
            src={`/assets/img/products/${item.id}.jpg`}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://placehold.co/64x64/f3f4f6/9ca3af?text=IMG'
            }}
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/catalog/${item.id}`}>
          <h3 className="text-sm font-medium text-gray-900 hover:text-primary transition-colors truncate">
            {item.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-0.5">
          ${item.price.toFixed(2)} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(item.quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(item.quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Subtotal */}
      <div className="text-right min-w-[64px]">
        <p className="text-sm font-semibold text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-400 hover:text-red-500"
        onClick={remove}
        aria-label="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
