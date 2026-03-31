import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Page Not Found</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
          This page has been classified or doesn&apos;t exist. Our operatives are investigating.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalog">Browse Catalog</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
