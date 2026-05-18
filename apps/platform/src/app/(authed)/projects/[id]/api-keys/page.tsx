'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Key, Lock, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
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
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { CreateApiKeyDialog } from '@/components/api-keys/create-api-key-dialog'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'

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

export default function ProjectApiKeysPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKeyShape[] | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [revealed, setRevealed] = useState<{ key: ApiKeyShape; plaintext: string } | null>(
    null
  )
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKeyShape | null>(null)
  const [revokeText, setRevokeText] = useState('')
  const [revoking, setRevoking] = useState(false)

  async function load() {
    const res = await apiKeysClient.list()
    if (res.error) {
      toast(res.error, 'error')
      setKeys([])
      return
    }
    setKeys((res.data?.data ?? []).filter((k) => k.project_id === params.id))
  }

  useEffect(() => {
    load()
  }, [params.id])

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
    setRevokeText('')
    load()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Clés API</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Toutes les clés rattachées à ce projet.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle clé
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {keys === null ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : keys.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Aucune clé dans ce projet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Créez votre première clé pour commencer.
              </p>
              <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une clé
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence>
                {keys.map((k, index) => {
                  const status = statusInfo(k.status)
                  return (
                    <motion.div
                      key={k.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-hover transition-colors"
                    >
                      <Link
                        href={`/projects/${params.id}/keys/${k.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {k.name}
                          </span>
                          <Badge variant={status.variant} size="sm">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <code className="font-mono">{k.masked_token}</code>
                          <span aria-hidden>•</span>
                          <span>
                            {k.scopes.length} permission{k.scopes.length > 1 ? 's' : ''}
                          </span>
                          <span aria-hidden>•</span>
                          <span>{formatRelative(k.last_used_at)}</span>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        {k.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              setConfirmRevoke(k)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/projects/${params.id}/keys/${k.id}`}>
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

      <CreateApiKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={params.id}
        onCreated={({ key, plaintext }) => {
          setCreateOpen(false)
          setRevealed({ key, plaintext })
          load()
        }}
      />

      <RevealedKeyDialog
        open={revealed !== null}
        plaintext={revealed?.plaintext ?? ''}
        keyName={revealed?.key.name ?? ''}
        kind="api_key"
        onClose={() => {
          const target = revealed
          setRevealed(null)
          if (target) {
            router.push(`/projects/${params.id}/keys/${target.key.id}`)
          }
        }}
      />

      <Dialog
        open={confirmRevoke !== null}
        onClose={() => {
          if (!revoking) {
            setConfirmRevoke(null)
            setRevokeText('')
          }
        }}
      >
        <DialogHeader showClose={false}>
          <DialogTitle>Révoquer la clé</DialogTitle>
          <DialogDescription>
            La clé cessera de fonctionner immédiatement. Action irréversible.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Field>
            <FieldLabel htmlFor="rev-name">
              Tapez <span className="font-mono">{confirmRevoke?.name}</span>
            </FieldLabel>
            <Input
              id="rev-name"
              value={revokeText}
              onChange={(e) => setRevokeText(e.target.value)}
              autoFocus
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmRevoke(null)
              setRevokeText('')
            }}
            disabled={revoking}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleRevoke}
            disabled={revoking || revokeText.trim() !== (confirmRevoke?.name ?? '').trim()}
          >
            {revoking ? (
              <>
                <Spinner />
                Révocation...
              </>
            ) : (
              'Révoquer'
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
