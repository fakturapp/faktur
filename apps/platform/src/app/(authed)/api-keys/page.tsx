'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import {
  Key,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { useApiKeys } from '@/lib/api-keys-context'
import { CreateApiKeyDialog } from '@/components/api-keys/create-api-key-dialog'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'
import { useAuth } from '@/lib/auth'
import { DOCS_URL } from '@/lib/oauth-config'

function formatRelative(iso: string | null): string {
  if (!iso) return 'jamais utilisée'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return `il y a ${diffSec}s`
  const m = Math.floor(diffSec / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString()
}

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

export default function ApiKeysPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { keys, loading, reload, openCreate, createOpen, closeCreate } = useApiKeys()
  const [revealed, setRevealed] = useState<{ key: ApiKeyShape; plaintext: string } | null>(
    null
  )
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKeyShape | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const teamEncryptionMode =
    (user as { currentTeamEncryptionMode?: 'private' | 'standard' } | null)
      ?.currentTeamEncryptionMode ?? 'standard'
  const isPrivateTeam = teamEncryptionMode === 'private'

  async function handleRevoke() {
    if (!confirmRevoke) return
    setRevoking(true)
    const res = await apiKeysClient.revoke(confirmRevoke.id)
    setRevoking(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Clé révoquée', 'success')
    setConfirmRevoke(null)
    setConfirmText('')
    reload()
  }

  if (keys === null && loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4 border-b border-border/50 last:border-b-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeCount = keys?.filter((k) => k.status === 'active').length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Clés API</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatisez Faktur depuis vos scripts. Chaque clé a ses propres permissions,
            quotas et événements webhook.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={DOCS_URL} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </Link>
          <Button size="sm" onClick={openCreate} disabled={isPrivateTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle clé
          </Button>
        </div>
      </div>

      {isPrivateTeam && (
        <Card className="border-amber-400/40 bg-amber-400/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  API non disponible en mode Privé
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Votre équipe utilise le chiffrement de bout en bout. L&apos;API requiert le
                  mode Standard. Vous pouvez migrer depuis Paramètres &rsaquo; Équipe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0">
          {!keys || keys.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Aucune clé API</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Créez votre première clé pour commencer à automatiser Faktur.
              </p>
              {!isPrivateTeam && (
                <Button size="sm" className="mt-4" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une clé
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence>
                {keys.map((key, index) => {
                  const status = statusInfo(key.status)
                  return (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-hover transition-colors"
                    >
                      <Link href={`/api-keys/${key.id}`} className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {key.name}
                          </span>
                          <Badge variant={status.variant} size="sm">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <code className="font-mono">{key.masked_token}</code>
                          <span aria-hidden>•</span>
                          <span>
                            {key.scopes.length} permission{key.scopes.length > 1 ? 's' : ''}
                          </span>
                          <span aria-hidden>•</span>
                          <span>{formatRelative(key.last_used_at)}</span>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        {key.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              setConfirmRevoke(key)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/api-keys/${key.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {keys && keys.length > 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          {activeCount} clé{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} sur{' '}
          {keys.length}
        </p>
      )}

      <CreateApiKeyDialog
        open={createOpen}
        onClose={closeCreate}
        onCreated={({ key, plaintext }) => {
          closeCreate()
          setRevealed({ key, plaintext })
          reload()
        }}
      />

      <RevealedKeyDialog
        open={revealed !== null}
        plaintext={revealed?.plaintext ?? ''}
        keyName={revealed?.key.name ?? ''}
        kind="api_key"
        onClose={() => setRevealed(null)}
      />

      <Dialog
        open={confirmRevoke !== null}
        onClose={() => {
          if (!revoking) {
            setConfirmRevoke(null)
            setConfirmText('')
          }
        }}
      >
        <DialogHeader
          onClose={() => {
            setConfirmRevoke(null)
            setConfirmText('')
          }}
        >
          <DialogTitle>Révoquer la clé</DialogTitle>
          <DialogDescription>
            La clé cessera de fonctionner immédiatement. Toute intégration qui l&apos;utilise
            recevra un 401. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Field>
            <FieldLabel htmlFor="confirm-name">
              Tapez{' '}
              <span className="font-mono text-foreground">{confirmRevoke?.name}</span> pour
              confirmer
            </FieldLabel>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmRevoke?.name ?? ''}
              autoFocus
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmRevoke(null)
              setConfirmText('')
            }}
            disabled={revoking}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleRevoke}
            disabled={revoking || confirmText.trim() !== (confirmRevoke?.name ?? '').trim()}
          >
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
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
