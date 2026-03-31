import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { TagFilter } from '@/components/catalog/TagFilter'
import { ProductGridSkeleton } from '@/components/ui/LoadingSkeleton'
import { getProducts, getTags } from '@/lib/api/catalog.server'

const PAGE_SIZE = 6

interface CatalogPageProps {
  searchParams: Promise<{ tag?: string; page?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const tag = params.tag || ''
  const page = parseInt(params.page || '1', 10)

  const [catalog, tags] = await Promise.all([
    getProducts(tag, page, PAGE_SIZE),
    getTags(),
  ])

  const totalPages = catalog.totalPages

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{catalog.totalSize} events</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-40 h-48 animate-pulse bg-gray-100 rounded-lg" />}>
            <TagFilter tags={tags} />
          </Suspense>

          {/* Main Content */}
          <div className="flex-1">
            <p className="text-center text-xs text-gray-400 mb-4">
              These events are for demonstration purposes only
            </p>

            {catalog.products.length > 0 ? (
              <>
                <Suspense fallback={<ProductGridSkeleton />}>
                  <ProductGrid products={catalog.products} />
                </Suspense>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <nav
                      className="inline-flex items-center rounded-lg bg-white border border-gray-200 overflow-hidden"
                      aria-label="Pagination"
                    >
                      <Link
                        href={`/catalog?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(Math.max(1, page - 1)) })}`}
                        className="inline-flex items-center justify-center w-10 h-10 border-r border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Link>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                        <Link
                          key={i}
                          href={`/catalog?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(i) })}`}
                          className={`inline-flex items-center justify-center w-10 h-10 border-r border-gray-200 text-sm font-medium transition-colors ${
                            i === page
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          aria-current={i === page ? 'page' : undefined}
                        >
                          {i}
                        </Link>
                      ))}

                      <Link
                        href={`/catalog?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(Math.min(totalPages, page + 1)) })}`}
                        className="inline-flex items-center justify-center w-10 h-10 text-gray-500 hover:bg-gray-50 transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm">No events found for this genre</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
