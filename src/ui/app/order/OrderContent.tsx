'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderSummarySkeleton } from '@/components/ui/LoadingSkeleton'
import type { Order } from '@/lib/types'
import { getClientSessionId } from '@/lib/client-session'

export function OrderContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    const sessionId = getClientSessionId()
    fetch(`/api/orders/orders/${orderId}`, {
      headers: { 'X-Session-ID': sessionId },
    })
      .then((r) => r.ok ? r.json() : null)
      .then(setOrder)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [orderId])

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-green-50">
            <Image
              src="/assets/img/order.jpg"
              alt="Order confirmed"
              fill
              className="object-cover"
              sizes="96px"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 text-sm">
            Your mission inventory has been dispatched for covert delivery.
          </p>
          {orderId && (
            <p className="text-xs text-gray-400 mt-2 font-mono">
              Order #{orderId}
            </p>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100">
            <OrderSummarySkeleton />
          </div>
        ) : order ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Order Items */}
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Items Ordered
              </h2>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} <span className="text-gray-400">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) ?? '—'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>${order.shipping?.toFixed(2) ?? '—'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span>${order.tax?.toFixed(2) ?? '—'}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2 mt-2">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2) ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Shipping To</h2>
                <address className="text-sm text-gray-500 not-italic">
                  <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                  </p>
                  <p>{order.shippingAddress.email}</p>
                </address>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            Order details not available
          </div>
        )}

        <div className="flex gap-4 mt-8 justify-center">
          <Button asChild>
            <Link href="/catalog">Continue Shopping</Link>
          </Button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          For demonstration purposes only
        </p>
      </div>
    </div>
  )
}
