'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import { cn, formatDateShort } from '@/lib/utils'
import { MapPin, Calendar } from 'lucide-react'
import { useAddToCart } from '@/hooks/useAddToCart'
import { GENRE_BADGE_CLASSES, GENRE_BAR_CLASSES, DEFAULT_BADGE_CLASS, DEFAULT_BAR_CLASS } from '@/lib/constants/genres'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { loading, added, addToCart } = useAddToCart()
  const tag = product.tags[0]
  const badgeClass = GENRE_BADGE_CLASSES[tag?.name] ?? DEFAULT_BADGE_CLASS
  const barClass = GENRE_BAR_CLASSES[tag?.name] ?? DEFAULT_BAR_CLASS

  return (
    <Link href={`/catalog/${product.id}`} className="group block">
      <article className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-200">

        {product.image ? (
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
            <Image
              src={product.image}
              alt={product.artist ?? product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              quality={90}
            />
            <div className={cn('absolute bottom-0 left-0 right-0 h-1', barClass)} />
          </div>
        ) : (
          <div className={cn('h-1.5', barClass)} />
        )}

        <div className="p-4 space-y-3">
          {tag && (
            <span className={cn('inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full', badgeClass)}>
              {tag.displayName}
            </span>
          )}

          <div>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {product.artist ?? product.name}
            </h3>
            {product.artist && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.name}</p>
            )}
          </div>

          <div className="space-y-1">
            {product.date && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{formatDateShort(product.date)}</span>
              </div>
            )}
            {product.venue && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{product.venue}, {product.city}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <div>
              <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
              <span className="text-xs text-gray-400 ml-1">/ ticket</span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product) }}
              disabled={loading}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150',
                added ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {loading ? '...' : added ? '✓ Added' : 'Get Tickets'}
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
