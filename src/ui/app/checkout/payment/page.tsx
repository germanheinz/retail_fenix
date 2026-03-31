'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCard, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import { OrderSummarySkeleton } from '@/components/ui/LoadingSkeleton'
import type { Checkout } from '@/lib/types'
import { getClientSessionId } from '@/lib/client-session'

export default function PaymentPage() {
  const router = useRouter()
  const [checkout, setCheckout] = useState<Checkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Demo payment form (not a real payment)
  const [form, setForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  })

  useEffect(() => {
    const sessionId = getClientSessionId()
    fetch('/api/checkout/checkout', {
      headers: { 'X-Session-ID': sessionId },
    })
      .then((r) => r.json())
      .then((data: Checkout) => setCheckout(data))
      .catch(() => {
        toast.error('Failed to load checkout')
        router.push('/checkout')
      })
      .finally(() => setLoading(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const sessionId = getClientSessionId()
    try {
      // Submit checkout to orders service
      const res = await fetch('/api/checkout/checkout/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
      })

      if (!res.ok) throw new Error('Failed to submit order')
      const result = await res.json()
      router.push(`/order?orderId=${result.orderId}`)
    } catch {
      toast.error('Failed to place order', {
        description: 'Please ensure all services are running',
      })
    } finally {
      setSubmitting(false)
    }
  }

  function formatCardNumber(value: string) {
    return value
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  function formatExpiry(value: string) {
    return value
      .replace(/\D/g, '')
      .slice(0, 4)
      .replace(/(\d{2})(?=\d)/, '$1/')
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <CheckoutProgress currentStep={3} />

        <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Payment Details</h1>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              Demo only — no real payment
            </div>
          </div>

          {loading ? (
            <OrderSummarySkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                <p className="text-xs text-amber-700">
                  <strong>Demo mode:</strong> This is a simulated payment form. No real payment will be processed.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nameOnCard">Name on Card</Label>
                <Input
                  id="nameOnCard"
                  value={form.nameOnCard}
                  onChange={(e) => setForm((p) => ({ ...p, nameOnCard: e.target.value }))}
                  placeholder="James Bond"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    value={form.cardNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))
                    }
                    placeholder="1234 5678 9012 3456"
                    className="pl-10"
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    value={form.expiry}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))
                    }
                    placeholder="MM/YY"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={form.cvv}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    placeholder="123"
                  />
                </div>
              </div>

              {/* Order Total */}
              {checkout && (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>${checkout.subtotal?.toFixed(2) ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Shipping</span>
                    <span>${checkout.shipping?.toFixed(2) ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tax</span>
                    <span>${checkout.tax?.toFixed(2) ?? '—'}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 text-base border-t border-gray-100 pt-2">
                    <span>Total</span>
                    <span>${checkout.total?.toFixed(2) ?? '—'}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/checkout/delivery')}
                >
                  Back
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                  <Lock className="w-4 h-4" />
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
