'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Trash2,
  Activity,
  Webhook,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { CreateApiKeyDialog } from '@/components/api-keys/create-api-key-dialog'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'
import { useAuth } from '@/lib/auth'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'never'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const m = Math.floor(diffSec / 60)
  if (m < 60) return `${m}min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function statusBadge(status: ApiKeyShape['status']) {
  if (status === 'active') return { label: 'Active', tone: 'success' as const }
  if (status === 'rotating') return { label: 'Rotating', tone: 'warning' as const }
  if (status === 'expired') return { label: 'Expired', tone: 'default' as const }
  return { label: 'Revoked', tone: 'destructive' as const }
}

export default function ApiKeysPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [keys, setKeys] = useState<ApiKeyShape[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [revealed, setRevealed] = useState<{ key: ApiKeyShape; plaintext: string } | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKeyShape | null>(null)
  const [revoking, setRevoking] = useState(false)

  const teamEncryptionMode =
    (user as { currentTeamEncryptionMode?: 'private' | 'standard' } | null)
      ?.currentTeamEncryptionMode ?? 'standard'
  const isPrivateTeam = teamEncryptionMode === 'private'

  async function load() {
    const res = await apiKeysClient.list()
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    setKeys(res.data?.data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRevoke() {
    if (!confirmRevoke) return
    setRevoking(true)
    const res = await apiKeysClient.revoke(confirmRevoke.id)
    setRevoking(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('API key revoked', 'success')
    setConfirmRevoke(null)
    load()
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-2">
              <Key className="size-5 text-violet-500" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">API & Webhooks</h1>
            <Badge variant="default" className="ml-2 text-[10px] uppercase tracking-wide">
              Beta
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Automate Faktur from your scripts and applications. Every key has its own scopes, rate
            limits, and webhook subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="https://developers.fakturapp.cc"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ExternalLink className="size-3.5" /> Documentation
          </Link>
          <Button
            onPress={() => setCreating(true)}
            isDisabled={isPrivateTeam}
            startContent={<Plus className="size-4" />}
          >
            Create key
          </Button>
        </div>
      </motion.div>

      {isPrivateTeam && (
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <Card className="border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <div>
                <h3 className="font-medium text-amber-700 dark:text-amber-200">
                  API is not available in Private encryption mode
                </h3>
                <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-200/80">
                  The Faktur API requires Standard encryption mode. Switch your team in Settings →
                  Members → Encryption to enable API access.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {keys === null ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : keys.length === 0 ? (
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <Card className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
            <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 p-4">
              <Sparkles className="size-7 text-violet-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No API keys yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first key to start automating Faktur — list invoices, create clients,
                receive webhook events.
              </p>
            </div>
            <Button
              onPress={() => setCreating(true)}
              isDisabled={isPrivateTeam}
              startContent={<Plus className="size-4" />}
            >
              Create your first key
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {keys.map((key, i) => {
              const badge = statusBadge(key.status)
              return (
                <motion.div
                  key={key.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card className="group p-4 transition-colors hover:bg-muted/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Link
                        href={`/dashboard/settings/api-keys/${key.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-medium">{key.name}</h3>
                          <Badge
                            variant={badge.tone === 'success' ? 'success' : badge.tone === 'warning' ? 'warning' : badge.tone === 'destructive' ? 'destructive' : 'default'}
                            className="shrink-0 text-[10px] uppercase tracking-wide"
                          >
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">{key.masked_token}</span>
                          <span>·</span>
                          <span>{key.scopes.length} scopes</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Activity className="size-3" />
                            last call {formatRelative(key.last_used_at)}
                          </span>
                          {key.allowed_ips && key.allowed_ips.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Globe className="size-3" />
                                {key.allowed_ips.length} IP{key.allowed_ips.length > 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        {key.status === 'active' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setConfirmRevoke(key)}
                            startContent={<Trash2 className="size-3.5" />}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <p className="text-center text-xs text-muted-foreground">
            {keys.filter((k) => k.status === 'active').length} active key
            {keys.filter((k) => k.status === 'active').length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <CreateApiKeyDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={({ key, plaintext }) => {
          setCreating(false)
          setRevealed({ key, plaintext })
          load()
        }}
      />

      <RevealedKeyDialog
        open={revealed !== null}
        plaintext={revealed?.plaintext ?? ''}
        keyName={revealed?.key.name ?? ''}
        kind="api_key"
        onClose={() => setRevealed(null)}
      />

      <ConfirmRevokeDialog
        open={confirmRevoke !== null}
        keyName={confirmRevoke?.name ?? ''}
        loading={revoking}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={handleRevoke}
      />
    </div>
  )
}

function ConfirmRevokeDialog({
  open,
  keyName,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean
  keyName: string
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (!open) setTyped('')
  }, [open])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-rose-500/15 p-2">
              <Trash2 className="size-5 text-rose-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Revoke this API key</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The key will stop working immediately. Any integration using it will fail with a
                401 response. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Type{' '}
              <span className="font-mono text-foreground">{keyName}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              placeholder={keyName}
              autoFocus
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onPress={onClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button
              color="danger"
              isDisabled={typed.trim() !== keyName.trim() || loading}
              onPress={onConfirm}
              isLoading={loading}
            >
              Revoke
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
