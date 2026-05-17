'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Archive,
  ArchiveRestore,
  Edit3,
  Folder,
  Key,
  Plus,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react'
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
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { apiProjectsClient, type ApiProjectShape } from '@/lib/api-projects-client'
import { useProjects } from '@/lib/projects-context'

interface ContextMenuState {
  project: ApiProjectShape
  x: number
  y: number
}

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = Math.floor((Date.now() - then) / 1000)
  if (diff < 60) return `il y a ${diff}s`
  const m = Math.floor(diff / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString()
}

export default function ProjectsPage() {
  const { toast } = useToast()
  const { projects, loading, reload } = useProjects()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [renameTarget, setRenameTarget] = useState<ApiProjectShape | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenu(null)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', escape)
    }
  }, [menu])

  async function handleCreate() {
    if (!name.trim()) {
      toast('Le nom est requis', 'error')
      return
    }
    setSubmitting(true)
    const res = await apiProjectsClient.create({
      name: name.trim(),
      description: description.trim() || null,
    })
    setSubmitting(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Projet créé', 'success')
    setCreateOpen(false)
    setName('')
    setDescription('')
    reload()
  }

  function openContextMenu(e: React.MouseEvent, project: ApiProjectShape) {
    e.preventDefault()
    setMenu({ project, x: e.clientX, y: e.clientY })
  }

  async function handleRename() {
    if (!renameTarget) return
    if (!renameValue.trim()) {
      toast('Le nom est requis', 'error')
      return
    }
    const res = await apiProjectsClient.update(renameTarget.id, {
      name: renameValue.trim(),
    })
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Projet renommé', 'success')
    setRenameTarget(null)
    setRenameValue('')
    reload()
  }

  async function handleArchiveToggle(project: ApiProjectShape) {
    setMenu(null)
    const res = await apiProjectsClient.update(project.id, {
      is_archived: !project.is_archived,
    })
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast(project.is_archived ? 'Projet désarchivé' : 'Projet archivé', 'success')
    reload()
  }

  if (loading && projects === null) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const active = projects?.filter((p) => !p.is_archived) ?? []
  const archived = projects?.filter((p) => p.is_archived) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Projets</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Regroupez vos clés API par projet. Clic droit sur une ligne pour plus d&apos;options.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border/50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Nom</span>
            <span className="text-right">Clés</span>
            <span className="text-right hidden md:block">Modifié</span>
            <span className="text-right hidden md:block">Créé</span>
          </div>
          <div className="divide-y divide-border/40">
            {active.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Folder className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">Aucun projet actif</p>
                <Button size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un projet
                </Button>
              </div>
            ) : (
              active.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onContextMenu={(e) => openContextMenu(e, p)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {archived.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Archivés ({archived.length})
          </p>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {archived.map((p) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    onContextMenu={(e) => openContextMenu(e, p)}
                    archived
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[200px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-2xl"
          style={{ top: menu.y, left: menu.x }}
          role="menu"
        >
          <ContextMenuItem
            icon={Edit3}
            label="Renommer"
            disabled={menu.project.is_default}
            onClick={() => {
              setRenameTarget(menu.project)
              setRenameValue(menu.project.name)
              setMenu(null)
            }}
          />
          <ContextMenuItem
            icon={menu.project.is_default ? StarOff : Star}
            label={menu.project.is_default ? 'Projet par défaut' : 'Définir par défaut'}
            disabled={menu.project.is_default}
            onClick={() => setMenu(null)}
          />
          <ContextMenuItem
            icon={menu.project.is_archived ? ArchiveRestore : Archive}
            label={menu.project.is_archived ? 'Désarchiver' : 'Archiver'}
            onClick={() => handleArchiveToggle(menu.project)}
          />
          <div className="my-1 h-px bg-border" />
          <Link
            href={`/projects/${menu.project.id}/settings`}
            onClick={() => setMenu(null)}
          >
            <ContextMenuItem
              icon={Trash2}
              label="Supprimer…"
              destructive
              disabled={menu.project.is_default}
            />
          </Link>
        </div>
      )}

      <Dialog open={createOpen} onClose={() => !submitting && setCreateOpen(false)}>
        <DialogHeader onClose={() => setCreateOpen(false)}>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>
            Crée un projet pour regrouper des clés qui partagent un même usage (env, app
            cliente, équipe…).
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Field>
            <FieldLabel htmlFor="project-name">Nom</FieldLabel>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production app mobile"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="project-desc">Description</FieldLabel>
            <Input
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Clés utilisées par l'app iOS et Android"
            />
            <FieldDescription>Optionnel.</FieldDescription>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={submitting || !name.trim()}>
            {submitting ? (
              <>
                <Spinner />
                Création...
              </>
            ) : (
              'Créer le projet'
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={renameTarget !== null} onClose={() => setRenameTarget(null)}>
        <DialogHeader onClose={() => setRenameTarget(null)}>
          <DialogTitle>Renommer le projet</DialogTitle>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="rename-input">Nouveau nom</FieldLabel>
          <Input
            id="rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
            }}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRenameTarget(null)}>
            Annuler
          </Button>
          <Button
            onClick={handleRename}
            disabled={!renameValue.trim() || renameValue === renameTarget?.name}
          >
            Renommer
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}

function ProjectRow({
  project,
  onContextMenu,
  archived,
}: {
  project: ApiProjectShape
  onContextMenu: (e: React.MouseEvent) => void
  archived?: boolean
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      onContextMenu={onContextMenu}
      className={
        'grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-hover ' +
        (archived ? 'opacity-60' : '')
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
          <Folder className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
            {project.is_default && (
              <Badge variant="soft" size="sm">
                Défaut
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Key className="h-3 w-3" />
        {project.keys_count ?? 0}
      </div>
      <div className="hidden text-xs text-muted-foreground md:block w-24 text-right">
        {formatRelative(project.updated_at ?? project.created_at)}
      </div>
      <div className="hidden text-xs text-muted-foreground md:block w-24 text-right">
        {new Date(project.created_at).toLocaleDateString()}
      </div>
    </Link>
  )
}

function ContextMenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
  disabled,
}: {
  icon: React.ElementType
  label: string
  onClick?: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
        (destructive
          ? 'text-danger hover:bg-danger/10'
          : 'text-foreground hover:bg-surface-hover')
      }
      role="menuitem"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}
