'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import type { ShippingAddress } from '@/lib/types'
import { getClientSessionId } from '@/lib/client-session'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    email: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({})

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!form.address1.trim()) newErrors.address1 = 'Address is required'
    if (!form.city.trim()) newErrors.city = 'City is required'
    if (!form.state) newErrors.state = 'State is required'
    if (!form.zip.trim()) newErrors.zip = 'ZIP code is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email address'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const sessionId = getClientSessionId()
    try {
      // Create/update checkout with shipping address
      const res = await fetch('/api/checkout/checkout/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to save shipping address')
      router.push('/checkout/delivery')
    } catch {
      toast.error('Failed to save shipping address', {
        description: 'Please check the checkout service is running',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: keyof ShippingAddress, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <CheckoutProgress currentStep={1} />

        <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="James"
                  className={errors.firstName ? 'border-red-400' : ''}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Bond"
                  className={errors.lastName ? 'border-red-400' : ''}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="agent@mi6.gov"
                className={errors.email ? 'border-red-400' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address1">Street Address</Label>
              <Input
                id="address1"
                value={form.address1}
                onChange={(e) => handleChange('address1', e.target.value)}
                placeholder="1 Spy Street"
                className={errors.address1 ? 'border-red-400' : ''}
              />
              {errors.address1 && (
                <p className="text-xs text-red-500">{errors.address1}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
              <Input
                id="address2"
                value={form.address2}
                onChange={(e) => handleChange('address2', e.target.value)}
                placeholder="Suite 007"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="London"
                  className={errors.city ? 'border-red-400' : ''}
                />
                {errors.city && (
                  <p className="text-xs text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${errors.state ? 'border-red-400' : 'border-input'}`}
                >
                  <option value="">State</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-xs text-red-500">{errors.state}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={form.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
                  placeholder="10001"
                  className={errors.zip ? 'border-red-400' : ''}
                />
                {errors.zip && (
                  <p className="text-xs text-red-500">{errors.zip}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Continue to Delivery'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
