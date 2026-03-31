'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-6xl font-bold text-gray-200 mb-2">500</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Something went wrong</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
          Mission compromised. An unexpected error occurred while processing your request.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
