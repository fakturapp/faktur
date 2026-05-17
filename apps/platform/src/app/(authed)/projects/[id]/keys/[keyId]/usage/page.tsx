'use client'

import { Spinner } from '@/components/ui/spinner'
import { useApiKey } from '@/lib/api-key-context'
import { UsagePanel } from '@/components/api-keys/usage-panel'

export default function UsagePage() {
  const { apiKey } = useApiKey()

  if (!apiKey) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return <UsagePanel apiKey={apiKey} />
}
