import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react'
import { ProductCard } from '@/components/catalog/ProductCard'
import { AddToCartButton } from './AddToCartButton'
import { getProduct, getRecommendations } from '@/lib/api/catalog.server'
import { cn, formatDateLong } from '@/lib/utils'
import { GENRE_BADGE_CLASSES, GENRE_BAR_CLASSES, DEFAULT_BADGE_CLASS, DEFAULT_BAR_CLASS } from '@/lib/constants/genres'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  const [product, recommendations] = await Promise.all([
    getProduct(id),
    getRecommendations(id),
  ])

  if (!product) notFound()

  const tag = product.tags[0]
  const badgeClass = GENRE_BADGE_CLASSES[tag?.name] ?? DEFAULT_BADGE_CLASS
  const barClass = GENRE_BAR_CLASSES[tag?.name] ?? DEFAULT_BAR_CLASS

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-16">
          <div className={cn('h-2', barClass)} />

          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

              {/* Event info */}
              <div className="flex flex-col">
                {tag && (
                  <Link href={`/catalog?tag=${tag.name}`}>
                    <span className={cn(
                      'inline-block text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-4 cursor-pointer',
                      badgeClass
                    )}>
                      {tag.displayName}
                    </span>
                  </Link>
                )}

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{product.artist ?? product.name}</h1>
                {product.artist && <p className="text-base text-gray-500 mb-6">{product.name}</p>}

                <div className="space-y-3 mb-6">
                  {product.date && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{formatDateLong(product.date)}</span>
                    </div>
                  )}
                  {product.venue && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{product.venue}{product.city ? `, ${product.city}` : ''}</span>
                    </div>
                  )}
                  {product.capacity && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{product.capacity.toLocaleString()} capacity</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Image + pricing */}
              <div className="flex flex-col gap-4">
                {product.image && (
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.artist ?? product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 568px"
                      quality={90}
                      priority
                    />
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Price per ticket</p>
                    <span className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  </div>

                  <AddToCartButton product={product} />

                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Instant e-ticket delivery
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Secure checkout
                    </p>
                    <p className="text-xs text-gray-400 mt-1">* For demonstration purposes only</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
              More Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map(rec => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
