'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartItem } from '@/components/cart/CartItem'
import { CartItemSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCart } from '@/hooks/useCart'

export default function CartPage() {
  const { cart, isLoading } = useCart()

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you haven't added any spy gadgets to your cart yet."
            action={{ label: 'Browse Catalog', href: '/catalog' }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 px-6">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)
                    </span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-500">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mb-6">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Estimated Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button asChild className="w-full gap-2">
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full mt-3">
                  <Link href="/catalog">Continue Shopping</Link>
                </Button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  For demonstration purposes only
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
