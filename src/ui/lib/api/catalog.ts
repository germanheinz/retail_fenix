import type { Product, ProductPage, ProductTag } from '@/lib/types'

const API_BASE = '/api/catalog'

export async function getProducts(
  tag: string = '',
  page: number = 1,
  size: number = 6
): Promise<ProductPage> {
  const params = new URLSearchParams()
  if (tag) params.set('tag', tag)
  params.set('page', String(page))
  params.set('size', String(size))

  const res = await fetch(`${API_BASE}/products?${params}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`)
  }

  return res.json()
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status}`)
  }

  return res.json()
}

export async function getTags(): Promise<ProductTag[]> {
  const res = await fetch(`${API_BASE}/tags`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch tags: ${res.status}`)
  }

  return res.json()
}
