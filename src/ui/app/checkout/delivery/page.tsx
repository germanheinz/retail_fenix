'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import { OrderSummarySkeleton } from '@/components/ui/LoadingSkeleton'
import type { Checkout, ShippingOption } from '@/lib/types'
import { getClientSessionId } from '@/lib/client-session'
import { cn } from '@/lib/utils'

export default function DeliveryPage() {
  const router = useRouter()
  const [checkout, setCheckout] = useState<Checkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState<string>('')

  useEffect(() => {
    const sessionId = getClientSessionId()
    fetch('/api/checkout/checkout', {
      headers: { 'X-Session-ID': sessionId },
    })
      .then((r) => r.json())
      .then((data: Checkout) => {
        setCheckout(data)
        if (data.shippingOptions?.length > 0) {
          setSelectedToken(data.shippingOptions[0].token)
        }
      })
      .catch(() => {
        toast.error('Failed to load checkout')
        router.push('/checkout')
      })
      .finally(() => setLoading(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedToken) {
      toast.error('Please select a shipping method')
      return
    }

    setSubmitting(true)
    const sessionId = getClientSessionId()
    try {
      const res = await fetch('/api/checkout/checkout/delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({ token: selectedToken }),
      })

      if (!res.ok) throw new Error('Failed to save delivery method')
      router.push('/checkout/payment')
    } catch {
      toast.error('Failed to save delivery method')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <CheckoutProgress currentStep={2} />

        <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Choose Delivery Method</h1>

          {loading ? (
            <OrderSummarySkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {checkout?.shippingOptions && checkout.shippingOptions.length > 0 ? (
                checkout.shippingOptions.map((option: ShippingOption) => (
                  <label
                    key={option.token}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
                      selectedToken === option.token
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingOption"
                        value={option.token}
                        checked={selectedToken === option.token}
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="text-primary"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900 text-sm">{option.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Estimated {option.estimatedDays} business day{option.estimatedDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">
                      ${option.amount.toFixed(2)}
                    </span>
                  </label>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No shipping options available. Please ensure checkout service is running.
                </div>
              )}

              {/* Order Summary */}
              {checkout && checkout.items.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h3>
                  <div className="space-y-2 mb-4">
                    {checkout.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-medium">${item.totalCost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Subtotal</span>
                    <span>${checkout.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/checkout')}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !selectedToken}
                  className="flex-1"
                >
                  {submitting ? 'Saving...' : 'Continue to Payment'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
