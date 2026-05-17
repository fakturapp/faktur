'use client'

import { useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RotateCw, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { ApiKeyProvider, useApiKey } from '@/lib/api-key-context'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'

function statusInfo(status: ApiKeyShape['status']) {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'success' as const }
    case 'rotating':
      return { label: 'En rotation', variant: 'warning' as const }
    case 'expired':
      return { label: 'Expirée', variant: 'muted' as const }
    case 'revoked':
      return { label: 'Révoquée', variant: 'destructive' as const }
  }
}

function KeyHeader() {
  const params = useParams<{ id: string; keyId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { apiKey, reload } = useApiKey()
  const [rotated, setRotated] = useState<{ plaintext: string } | null>(null)
  const [rotating, setRotating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  async function handleRotate() {
    if (!apiKey) return
    setRotating(true)
    const res = await apiKeysClient.rotate(apiKey.id)
    setRotating(false)
    if (res.error || !res.data?.plaintext) {
      toast(res.error || 'Échec de la rotation', 'error')
      return
    }
    toast('Clé rotée — l’ancien secret est invalidé', 'success')
    setRotated({ plaintext: res.data.plaintext })
    reload()
  }

  async function handleRevoke() {
    if (!apiKey) return
    if (!confirm(`Révoquer la clé « ${apiKey.name} » ? Cette action est irréversible.`)) return
    setRevoking(true)
    const res = await apiKeysClient.revoke(apiKey.id)
    setRevoking(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Clé révoquée', 'success')
    router.push(`/projects/${params.id}`)
  }

  if (!apiKey) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  const status = statusInfo(apiKey.status)
  const isActive = apiKey.status === 'active'

  return (
    <>
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-foreground truncate">{apiKey.name}</h1>
                <Badge variant={status.variant} size="sm">
                  {status.label}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {apiKey.masked_token}
              </p>
            </div>
            {isActive && (
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRotate} disabled={rotating}>
                  {rotating ? (
                    <>
                      <Spinner />
                      Rotation...
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Roter
                    </>
                  )}
                </Button>
                <Button variant="danger" size="sm" onClick={handleRevoke} disabled={revoking}>
                  {revoking ? (
                    <>
                      <Spinner />
                      Révocation...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Révoquer
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <RevealedKeyDialog
        open={rotated !== null}
        plaintext={rotated?.plaintext ?? ''}
        keyName={apiKey.name}
        kind="api_key"
        onClose={() => setRotated(null)}
      />
    </>
  )
}

export default function ApiKeyLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string; keyId: string }>()
  const router = useRouter()

  return (
    <ApiKeyProvider
      keyId={params.keyId}
      onNotFound={() => router.push(`/projects/${params.id}`)}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
      >
        <KeyHeader />
        {children}
      </motion.div>
    </ApiKeyProvider>
  )
}
