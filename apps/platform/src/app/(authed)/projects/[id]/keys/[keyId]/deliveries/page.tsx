'use client'

import { Spinner } from '@/components/ui/spinner'
import { useApiKey } from '@/lib/api-key-context'
import { DeliveriesPanel } from '@/components/api-keys/deliveries-panel'

export default function DeliveriesPage() {
  const { apiKey } = useApiKey()

  if (!apiKey) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return <DeliveriesPanel apiKey={apiKey} />
}
