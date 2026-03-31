import { Info } from 'lucide-react'

interface MetadataAttribute {
  name: string
  value: string
}

interface MetadataSet {
  name: string
  provider: string
  attributes: MetadataAttribute[]
}

interface MetadataResponse {
  sets: MetadataSet[]
  focusAttributes?: Array<{
    name: string
    value: string
    provider: string
  }>
}

async function getMetadata(): Promise<MetadataResponse> {
  try {
    // Gather metadata from environment — Kubernetes, ECS, EC2, etc.
    // In Next.js this is server-side; we gather available env info
    const sets: MetadataSet[] = []

    // Node/runtime info
    const nodeSet: MetadataSet = {
      name: 'runtime',
      provider: 'node',
      attributes: [
        { name: 'nodeVersion', value: process.version },
        { name: 'platform', value: process.platform },
        { name: 'arch', value: process.arch },
        { name: 'pid', value: String(process.pid) },
      ],
    }
    sets.push(nodeSet)

    // Kubernetes metadata (from env vars injected by K8s downward API)
    const k8sAttrs: MetadataAttribute[] = []
    if (process.env.MY_POD_NAME) k8sAttrs.push({ name: 'podName', value: process.env.MY_POD_NAME })
    if (process.env.MY_NODE_NAME) k8sAttrs.push({ name: 'nodeName', value: process.env.MY_NODE_NAME })
    if (process.env.MY_NAMESPACE) k8sAttrs.push({ name: 'namespace', value: process.env.MY_NAMESPACE })
    if (process.env.MY_POD_IP) k8sAttrs.push({ name: 'podIp', value: process.env.MY_POD_IP })
    if (k8sAttrs.length > 0) {
      sets.push({ name: 'kubernetes', provider: 'kubernetes', attributes: k8sAttrs })
    }

    // ECS metadata
    const ecsAttrs: MetadataAttribute[] = []
    if (process.env.ECS_CONTAINER_METADATA_URI) {
      ecsAttrs.push({ name: 'metadataUri', value: process.env.ECS_CONTAINER_METADATA_URI })
    }
    if (process.env.AWS_REGION) ecsAttrs.push({ name: 'awsRegion', value: process.env.AWS_REGION })
    if (ecsAttrs.length > 0) {
      sets.push({ name: 'ecs', provider: 'ecs', attributes: ecsAttrs })
    }

    // Application config
    const appAttrs: MetadataAttribute[] = []
    if (process.env.RETAIL_UI_THEME) appAttrs.push({ name: 'theme', value: process.env.RETAIL_UI_THEME })
    if (process.env.RETAIL_UI_ENDPOINTS_CATALOG) appAttrs.push({ name: 'catalogEndpoint', value: process.env.RETAIL_UI_ENDPOINTS_CATALOG })
    if (process.env.RETAIL_UI_ENDPOINTS_CARTS) appAttrs.push({ name: 'cartsEndpoint', value: process.env.RETAIL_UI_ENDPOINTS_CARTS })
    if (process.env.RETAIL_UI_ENDPOINTS_CHECKOUT) appAttrs.push({ name: 'checkoutEndpoint', value: process.env.RETAIL_UI_ENDPOINTS_CHECKOUT })
    if (process.env.RETAIL_UI_ENDPOINTS_ORDERS) appAttrs.push({ name: 'ordersEndpoint', value: process.env.RETAIL_UI_ENDPOINTS_ORDERS })
    if (process.env.RETAIL_UI_CHAT_ENABLED) appAttrs.push({ name: 'chatEnabled', value: process.env.RETAIL_UI_CHAT_ENABLED })
    if (process.env.RETAIL_UI_CHAT_PROVIDER) appAttrs.push({ name: 'chatProvider', value: process.env.RETAIL_UI_CHAT_PROVIDER })
    sets.push({ name: 'application', provider: 'application', attributes: appAttrs })

    return { sets }
  } catch {
    return { sets: [] }
  }
}

const PROVIDER_LABELS: Record<string, string> = {
  runtime: 'Node.js Runtime',
  kubernetes: 'Kubernetes',
  ecs: 'Amazon ECS',
  lambda: 'AWS Lambda',
  ec2: 'Amazon EC2',
  application: 'Application',
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  nodeVersion: 'Node.js Version',
  platform: 'Platform',
  arch: 'Architecture',
  pid: 'Process ID',
  podName: 'Pod Name',
  nodeName: 'Node Name',
  namespace: 'Namespace',
  podIp: 'Pod IP',
  metadataUri: 'Metadata URI',
  awsRegion: 'AWS Region',
  theme: 'Theme',
  catalogEndpoint: 'Catalog Endpoint',
  cartsEndpoint: 'Carts Endpoint',
  checkoutEndpoint: 'Checkout Endpoint',
  ordersEndpoint: 'Orders Endpoint',
  chatEnabled: 'Chat Enabled',
  chatProvider: 'Chat Provider',
}

export default async function InfoPage() {
  const metadata = await getMetadata()

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-gray-900">Metadata</h1>
        </div>

        {metadata.sets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No metadata available
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/80">
              <p className="text-sm text-gray-600">
                System and environment metadata for this instance
              </p>
            </div>

            {/* Metadata Sections */}
            {metadata.sets.map((set, idx) => (
              <div key={set.name} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                <div className="px-6 py-3 bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {PROVIDER_LABELS[set.name] ?? set.name}
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {set.attributes
                    .filter((attr) => attr.value)
                    .map((attr) => (
                      <div key={attr.name} className="grid grid-cols-3 px-6 py-3">
                        <div className="text-sm text-gray-500">
                          {ATTRIBUTE_LABELS[attr.name] ?? attr.name}
                        </div>
                        <div className="col-span-2 text-sm text-gray-900 font-mono break-all">
                          {attr.value}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
