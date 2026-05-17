'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Folder, Plus, Key, Archive } from 'lucide-react'
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
import { apiProjectsClient } from '@/lib/api-projects-client'
import { useProjects } from '@/lib/projects-context'

export default function ProjectsPage() {
  const { toast } = useToast()
  const { projects, loading, reload } = useProjects()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
            Regroupez vos clés API par projet pour les isoler et suivre leur usage
            séparément.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="block">
            <Card className="h-full border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Folder className="h-4 w-4" />
                  </div>
                  {p.is_default && (
                    <Badge variant="soft" size="sm">
                      Défaut
                    </Badge>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground truncate">
                  {p.name}
                </h3>
                {p.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Key className="h-3 w-3" />
                  {p.keys_count ?? 0} clé{(p.keys_count ?? 0) > 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="block text-left"
        >
          <Card className="h-full border-dashed border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[152px]">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">Nouveau projet</p>
              <p className="text-xs text-muted-foreground">Organisez vos clés</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {archived.length > 0 && (
        <div>
          <p className="px-1 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Archivés
          </p>
          <div className="grid gap-2">
            {archived.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block">
                <Card className="border-border/50 opacity-60 hover:opacity-100 transition-opacity">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {p.keys_count ?? 0} clé(s)
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
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
    </motion.div>
  )
}
