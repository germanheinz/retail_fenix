'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCartCount } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import { MOCK_TAGS } from '@/lib/mock/data'

const MARQUEE_ITEMS = [
  '🎵 New events added every week',
  '🎟 Instant e-ticket delivery',
  '🔒 Secure checkout guaranteed',
  '🎶 Demo Events Platform — Fenix',
] as const

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const cartCount = useCartCount()
  const pathname = usePathname()

  return (
    <>
      {/* Top marquee banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 overflow-hidden text-xs">
        <div className="animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((text, i) => (
            <span key={i} className="mx-8">{text}</span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="flex px-6 sm:px-10 py-3 justify-between items-center w-full border-b border-gray-100 bg-white sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Fenix
          </Link>
          <span className="text-gray-400 text-sm ml-1">| Shop</span>
        </div>

        {/* Desktop category links */}
        <div className="hidden sm:flex items-center">
          {MOCK_TAGS.map((tag) => (
            <Link
              key={tag.name}
              href={`/catalog?tag=${tag.name}`}
              className={cn(
                'm-1 px-3 py-1.5 rounded-md text-sm transition-all hover:bg-gray-100',
                pathname.includes(`tag=${tag.name}`) ? 'bg-gray-100 font-medium' : 'text-gray-700'
              )}
            >
              {tag.displayName}
            </Link>
          ))}
          <Link
            href="/catalog"
            className={cn(
              'm-1 px-3 py-1.5 rounded-md text-sm transition-all hover:bg-gray-100',
              pathname === '/catalog' && !pathname.includes('tag=') ? 'bg-gray-100 font-medium' : 'text-gray-700'
            )}
          >
            All
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <Link
            href="/cart"
            className="mx-2 relative p-2 rounded-md hover:bg-gray-100 transition-all"
            aria-label={`Cart${cartCount > 0 ? ` (${cartCount})` : ''}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            className="sm:hidden p-2 rounded-md hover:bg-gray-100 transition-all text-sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100 px-6 py-3 z-40 sticky top-[105px]">
          <div className="flex flex-col gap-1">
            {MOCK_TAGS.map((tag) => (
              <Link
                key={tag.name}
                href={`/catalog?tag=${tag.name}`}
                className="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-all"
                onClick={() => setMobileOpen(false)}
              >
                {tag.displayName}
              </Link>
            ))}
            <Link
              href="/catalog"
              className="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              All Events
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
