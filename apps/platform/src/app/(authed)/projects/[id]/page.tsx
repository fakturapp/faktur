'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Archive,
  ArrowLeft,
  ChevronRight,
  Folder,
  Key,
  Lock,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'
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
  apiKeysClient,
  type ApiKeyShape,
} from '@/lib/api-keys-client'
import { apiProjectsClient, type ApiProjectShape } from '@/lib/api-projects-client'
import { useProjects } from '@/lib/projects-context'
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

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const { reload: reloadProjects } = useProjects()
  const [project, setProject] = useState<ApiProjectShape | null>(null)
  const [keys, setKeys] = useState<ApiKeyShape[] | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [revealed, setRevealed] = useState<{ key: ApiKeyShape; plaintext: string } | null>(
    null
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [editingDesc, setEditingDesc] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKeyShape | null>(null)
  const [revokeText, setRevokeText] = useState('')
  const [revoking, setRevoking] = useState(false)

  async function loadProject() {
    const res = await apiProjectsClient.show(params.id)
    if (res.error || !res.data?.data) {
      toast(res.error || 'Projet introuvable', 'error')
      return
    }
    setProject(res.data.data)
    setEditingName(res.data.data.name)
    setEditingDesc(res.data.data.description ?? '')
  }

  async function loadKeys() {
    const res = await apiKeysClient.list()
    if (res.error) {
      toast(res.error, 'error')
      setKeys([])
      return
    }
    setKeys((res.data?.data ?? []).filter((k) => k.project_id === params.id))
  }

  useEffect(() => {
    loadProject()
    loadKeys()
  }, [params.id])

  async function handleSaveSettings() {
    if (!project) return
    setSavingSettings(true)
    const res = await apiProjectsClient.update(project.id, {
      name: editingName.trim(),
      description: editingDesc.trim() || null,
    })
    setSavingSettings(false)
    if (res.error || !res.data?.data) {
      toast(res.error || 'Échec de la mise à jour', 'error')
      return
    }
    setProject(res.data.data)
    setSettingsOpen(false)
    reloadProjects()
    toast('Projet mis à jour', 'success')
  }

  async function handleDelete() {
    if (!project) return
    setDeleting(true)
    const res = await apiProjectsClient.destroy(project.id)
    setDeleting(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Projet supprimé', 'success')
    reloadProjects()
    window.location.replace('/projects')
  }

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
    loadKeys()
  }

  if (!project) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const activeKeys = keys?.filter((k) => k.status === 'active').length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
    >
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tous les projets
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Folder className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground truncate">{project.name}</h1>
            {project.is_default && (
              <Badge variant="soft" size="sm">
                Défaut
              </Badge>
            )}
            {project.is_archived && (
              <Badge variant="muted" size="sm">
                Archivé
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle clé
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Clés</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{keys?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Actives</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{activeKeys}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Créé le
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Clés API
          </h2>
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
                          href={`/projects/${project.id}/keys/${k.id}`}
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
                          <Link href={`/projects/${project.id}/keys/${k.id}`}>
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
      </div>

      <CreateApiKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={project.id}
        onCreated={({ key, plaintext }) => {
          setCreateOpen(false)
          setRevealed({ key, plaintext })
          loadKeys()
        }}
      />

      <RevealedKeyDialog
        open={revealed !== null}
        plaintext={revealed?.plaintext ?? ''}
        keyName={revealed?.key.name ?? ''}
        kind="api_key"
        onClose={() => setRevealed(null)}
      />

      <Dialog open={settingsOpen} onClose={() => !savingSettings && setSettingsOpen(false)}>
        <DialogHeader onClose={() => setSettingsOpen(false)}>
          <DialogTitle>Paramètres du projet</DialogTitle>
          <DialogDescription>Renommez ou supprimez ce projet.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Field>
            <FieldLabel htmlFor="proj-edit-name">Nom</FieldLabel>
            <Input
              id="proj-edit-name"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              disabled={project.is_default}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="proj-edit-desc">Description</FieldLabel>
            <Input
              id="proj-edit-desc"
              value={editingDesc}
              onChange={(e) => setEditingDesc(e.target.value)}
            />
          </Field>
          {!project.is_default && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
              <p className="text-xs font-medium text-foreground mb-1">Zone dangereuse</p>
              <p className="text-xs text-muted-foreground mb-3">
                Le projet doit être vide (aucune clé active) pour être supprimé.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Supprimer le projet
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setSettingsOpen(false)}
            disabled={savingSettings}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={savingSettings || !editingName.trim()}
          >
            {savingSettings ? (
              <>
                <Spinner />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)}>
        <DialogHeader showClose={false}>
          <DialogTitle>Supprimer le projet</DialogTitle>
          <DialogDescription>
            « {project.name} » sera supprimé définitivement. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>

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
