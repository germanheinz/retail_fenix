import { ProductCard } from '@/components/catalog/ProductCard'
import { getProducts } from '@/lib/api/catalog.server'

export default async function HomePage() {
  const catalog = await getProducts('', 1, 12)

  return (
    <div className="px-5 sm:px-10">
      <div className="mt-3 mb-2">
        <h1 className="text-4xl font-semibold my-10">Events</h1>
        <h3 className="text-xl mb-5 text-gray-600">Upcoming Events</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {catalog.products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
