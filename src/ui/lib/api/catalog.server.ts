import type { Product, ProductPage, ProductTag } from '@/lib/types'
import { MOCK_PRODUCTS, MOCK_TAGS } from '@/lib/mock/data'

const ARTIST_IMAGES: Record<string, string> = {
  'Arctic Monkeys': '/assets/img/events/arctic_monkeys.jpg',
  'Bad Bunny': '/assets/img/events/bad_bunny.jpg',
  'Billie Eilish': '/assets/img/events/billie_eilish.jpg',
  'Coldplay': '/assets/img/events/coldplay.jpg',
  'Metallica': '/assets/img/events/metallica.jpg',
  'Tame Impala': '/assets/img/events/tame_impala.jpg',
  'Taylor Swift': '/assets/img/events/taylor_swift.jpg',
  'The Weeknd': '/assets/img/events/the_weeknd.jpg',
}

function enrichProduct(p: Product): Product {
  if (!p.image && p.artist && ARTIST_IMAGES[p.artist]) {
    return { ...p, image: ARTIST_IMAGES[p.artist] }
  }
  return p
}

async function fetchFromBackend<T>(path: string, fallback: T): Promise<T> {
  const CATALOG_URL = process.env.RETAIL_UI_ENDPOINTS_CATALOG
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
  if (tag) params.set('tags', tag)

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

  const result = await fetchFromBackend<ProductPage | Product[]>(`/catalog/products?${params}`, mockFallback)
  if (Array.isArray(result)) {
    const products = result.map(enrichProduct)
    return { page, size: products.length, totalSize: products.length, totalPages: 1, products }
  }
  return { ...result, products: result.products.map(enrichProduct) }
}

export async function getProduct(id: string): Promise<Product | null> {
  const fallback = MOCK_PRODUCTS.find(p => p.id === id) ?? null
  const product = await fetchFromBackend<Product | null>(`/catalog/products/${id}`, fallback)
  return product ? enrichProduct(product) : null
}

export async function getTags(): Promise<ProductTag[]> {
  return fetchFromBackend('/catalog/tags', MOCK_TAGS)
}

export async function getRecommendations(excludeId: string, count = 3): Promise<Product[]> {
  const result = await fetchFromBackend<ProductPage | Product[]>(
    '/catalog/products?page=1&size=12',
    { page: 1, size: 12, totalSize: 0, totalPages: 1, products: MOCK_PRODUCTS }
  )
  const products = Array.isArray(result) ? result : result.products
  return products
    .filter(p => p.id !== excludeId)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(enrichProduct)
}
