'use client'

import { Spinner } from '@/components/ui/spinner'
import { useApiKey } from '@/lib/api-key-context'
import { WebhookConfigPanel } from '@/components/api-keys/webhook-config-panel'

export default function WebhookPage() {
  const { apiKey, webhook, reload } = useApiKey()

  if (!apiKey) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return <WebhookConfigPanel apiKey={apiKey} webhook={webhook} onChanged={reload} />
}
