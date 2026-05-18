'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { type ApiKeyShape } from '@/lib/api-keys-client'
import { ApiKeyProvider, useApiKey } from '@/lib/api-key-context'

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
  const { apiKey } = useApiKey()

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

  return (
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
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/projects/${params.id}/keys/${params.keyId}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
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
        className="space-y-6 px-4 lg:px-6 pt-16 md:pt-20 pb-12 max-w-5xl mx-auto w-full"
      >
        <KeyHeader />
        {children}
      </motion.div>
    </ApiKeyProvider>
  )
}
