import { Tags, ShoppingCart, CreditCard, ClipboardList, Layers } from 'lucide-react'
import { ServiceCard } from '@/components/topology/ServiceCard'
import type { TopologyInfo } from '@/lib/types'

const CONNECT_TIMEOUT = 3000

async function getTopologyForService(
  serviceName: string,
  endpoint: string | undefined
): Promise<TopologyInfo> {
  const info: TopologyInfo = {
    serviceName,
    endpoint: endpoint || '',
    status: 'NONE',
  }

  if (!endpoint) return info

  info.status = 'HEALTHY'
  const topologyUrl = endpoint.endsWith('/')
    ? `${endpoint}topology`
    : `${endpoint}/topology`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CONNECT_TIMEOUT)

    const res = await fetch(topologyUrl, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      info.status = 'UNHEALTHY'
      return info
    }

    info.metadata = await res.json()
  } catch {
    info.status = 'UNHEALTHY'
  }

  return info
}

export default async function TopologyPage() {
  const [catalog, carts, checkout, orders] = await Promise.all([
    getTopologyForService('catalog', process.env.RETAIL_UI_ENDPOINTS_CATALOG),
    getTopologyForService('carts', process.env.RETAIL_UI_ENDPOINTS_CARTS),
    getTopologyForService('checkout', process.env.RETAIL_UI_ENDPOINTS_CHECKOUT),
    getTopologyForService('orders', process.env.RETAIL_UI_ENDPOINTS_ORDERS),
  ])

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-gray-900">Application Services</h1>
        </div>

        <ServiceCard
          info={catalog}
          icon={Tags}
          title="Catalog"
          metadataFields={[
            { key: 'persistenceProvider', label: 'Persistence Provider' },
            { key: 'databaseEndpoint', label: 'Database Endpoint', span: 2 },
          ]}
        />

        <ServiceCard
          info={carts}
          icon={ShoppingCart}
          title="Carts"
          metadataFields={[
            { key: 'persistenceProvider', label: 'Persistence Provider' },
            { key: 'dynamodbEndpoint', label: 'DynamoDB Endpoint', span: 2 },
            { key: 'dynamodbTable', label: 'DynamoDB Table' },
          ]}
        />

        <ServiceCard
          info={checkout}
          icon={CreditCard}
          title="Checkout"
          metadataFields={[
            { key: 'persistenceProvider', label: 'Persistence Provider' },
            { key: 'databaseEndpoint', label: 'Database Endpoint', span: 2 },
          ]}
        />

        <ServiceCard
          info={orders}
          icon={ClipboardList}
          title="Orders"
          metadataFields={[
            { key: 'persistenceProvider', label: 'Persistence Provider' },
            { key: 'databaseEndpoint', label: 'Database Endpoint', span: 2 },
            { key: 'messagingProvider', label: 'Messaging Provider' },
            { key: 'messagingEndpoint', label: 'Messaging Endpoint', span: 2 },
          ]}
        />
      </div>
    </div>
  )
}
