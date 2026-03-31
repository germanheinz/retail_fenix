import { CheckCircle, XCircle, MinusCircle, LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TopologyInfo } from '@/lib/types'

interface ServiceCardProps {
  info: TopologyInfo
  icon?: LucideIcon
  title: string
  metadataFields?: Array<{ key: string; label: string; span?: number }>
}

function StatusBadge({ status }: { status: TopologyInfo['status'] }) {
  if (status === 'HEALTHY') {
    return (
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Healthy
      </Badge>
    )
  }
  if (status === 'UNHEALTHY') {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Unhealthy
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="flex items-center gap-1 text-gray-400">
      <MinusCircle className="w-3 h-3" />
      Not configured
    </Badge>
  )
}

export function ServiceCard({ info, icon: Icon, title, metadataFields }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <StatusBadge status={info.status} />
      </div>

      {info.status !== 'NONE' && (
        <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50">
          <div className="mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Endpoint</p>
            <p className="text-sm text-gray-700 font-mono">{info.endpoint || '—'}</p>
          </div>

          {metadataFields && info.metadata && (
            <div className="grid grid-cols-3 gap-4">
              {metadataFields.map(({ key, label, span = 1 }) => (
                <div key={key} className={span > 1 ? `col-span-${span}` : ''}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm text-gray-700 truncate">
                    {info.metadata?.[key] || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Show all metadata if no specific fields defined */}
          {!metadataFields && info.metadata && Object.keys(info.metadata).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(info.metadata).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-gray-400 mb-0.5">{key}</p>
                  <p className="text-sm text-gray-700 truncate">{value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
