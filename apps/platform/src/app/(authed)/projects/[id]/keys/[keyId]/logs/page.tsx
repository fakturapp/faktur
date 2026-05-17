'use client'

import { Spinner } from '@/components/ui/spinner'
import { useApiKey } from '@/lib/api-key-context'
import { LogsPanel } from '@/components/api-keys/logs-panel'

export default function LogsPage() {
  const { apiKey } = useApiKey()

  if (!apiKey) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return <LogsPanel apiKey={apiKey} />
}
