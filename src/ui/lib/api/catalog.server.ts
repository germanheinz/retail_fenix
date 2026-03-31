import type { Product, ProductPage, ProductTag } from '@/lib/types'
import { MOCK_PRODUCTS, MOCK_TAGS } from '@/lib/mock/data'

const CATALOG_URL = process.env.RETAIL_UI_ENDPOINTS_CATALOG

async function fetchFromBackend<T>(path: string, fallback: T): Promise<T> {
  if (!CATALOG_URL) return fallback
  try {
    const res = await fetch(`${CATALOG_URL}${path}`, { cache: 'no-store' })
    if (!res.ok) return fallback
    return res.json()
  } catch (err) {
    console.error(`[catalog] fetch failed: ${path}`, err)
    return fallback
  }
}

export async function getProducts(tag: string, page: number, size: number): Promise<ProductPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (tag) params.set('tag', tag)

  const filtered = tag
    ? MOCK_PRODUCTS.filter(p => p.tags.some(t => t.name === tag))
    : MOCK_PRODUCTS
  const start = (page - 1) * size
  const mockFallback: ProductPage = {
    page,
    size,
    totalSize: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
    products: filtered.slice(start, start + size),
  }

  return fetchFromBackend(`/catalog/products?${params}`, mockFallback)
}

export async function getProduct(id: string): Promise<Product | null> {
  const fallback = MOCK_PRODUCTS.find(p => p.id === id) ?? null
  return fetchFromBackend(`/catalog/products/${id}`, fallback)
}

export async function getTags(): Promise<ProductTag[]> {
  return fetchFromBackend('/catalog/tags', MOCK_TAGS)
}

export async function getRecommendations(excludeId: string, count = 3): Promise<Product[]> {
  const page = await fetchFromBackend<ProductPage>(
    '/catalog/products?page=1&size=12',
    { page: 1, size: 12, totalSize: 0, totalPages: 1, products: MOCK_PRODUCTS }
  )
  return page.products
    .filter(p => p.id !== excludeId)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}
