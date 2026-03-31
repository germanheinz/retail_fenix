import { Suspense } from 'react'
import { OrderContent } from './OrderContent'

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
          </div>
        </div>
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
}
