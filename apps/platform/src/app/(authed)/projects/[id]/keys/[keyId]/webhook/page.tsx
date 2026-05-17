'use client'

import { Spinner } from '@/components/ui/spinner'
import { useApiKey } from '@/lib/api-key-context'
import { WebhookConfigPanel } from '@/components/api-keys/webhook-config-panel'
import { WebhookDeliveryConfigPanel } from '@/components/api-keys/webhook-delivery-config-panel'

export default function WebhookPage() {
  const { apiKey, webhook, reload } = useApiKey()

  if (!apiKey) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WebhookConfigPanel apiKey={apiKey} webhook={webhook} onChanged={reload} />
      {webhook && <WebhookDeliveryConfigPanel apiKeyId={apiKey.id} />}
    </div>
  )
}
