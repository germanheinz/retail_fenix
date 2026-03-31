'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ProductTag } from '@/lib/types'

interface TagFilterProps {
  tags: ProductTag[]
}

export function TagFilter({ tags }: TagFilterProps) {
  const searchParams = useSearchParams()
  const selectedTag = searchParams.get('tag') || ''

  return (
    <div className="w-full md:w-40 flex-shrink-0">
      <h3 className="font-semibold text-gray-500 mb-3 uppercase text-xs tracking-wider">
        Categories
      </h3>
      <ul className="space-y-1">
        <li>
          <Link
            href="/catalog"
            className={cn(
              'block py-1.5 px-2 rounded-md text-sm transition-colors',
              selectedTag === ''
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            All Products
          </Link>
        </li>
        {tags.map((tag) => (
          <li key={tag.name}>
            <Link
              href={`/catalog?tag=${tag.name}`}
              className={cn(
                'block py-1.5 px-2 rounded-md text-sm transition-colors',
                selectedTag === tag.name
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {tag.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
