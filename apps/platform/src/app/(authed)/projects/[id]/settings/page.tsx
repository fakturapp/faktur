'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { reload: reloadProjects } = useProjects()

  const [project, setProject] = useState<ApiProjectShape | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    apiProjectsClient.show(params.id).then((res) => {
      if (res.data?.data) {
        setProject(res.data.data)
        setName(res.data.data.name)
        setDescription(res.data.data.description ?? '')
      }
    })
  }, [params.id])

  async function handleSave() {
    if (!project) return
    setSaving(true)
    const res = await apiProjectsClient.update(project.id, {
      name: name.trim(),
      description: description.trim() || null,
    })
    setSaving(false)
    if (res.error || !res.data?.data) {
      toast(res.error || 'Échec de la mise à jour', 'error')
      return
    }
    setProject(res.data.data)
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
    router.replace('/projects')
  }

  if (!project) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-3xl mx-auto w-full"
    >
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">Paramètres</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Nom, description et suppression du projet.
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <Field>
            <FieldLabel htmlFor="proj-name">Nom</FieldLabel>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={project.is_default}
            />
            {project.is_default && (
              <FieldDescription>
                Le projet par défaut ne peut pas être renommé.
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="proj-desc">Description</FieldLabel>
            <Input
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionnel"
            />
          </Field>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <Spinner />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!project.is_default && (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Zone dangereuse</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              La suppression est définitive. Le projet doit être vide (aucune clé active) pour
              pouvoir être supprimé.
            </p>
            <div className="mt-4">
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
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)}>
        <DialogHeader showClose={false}>
          <DialogTitle>Supprimer « {project.name} » ?</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Le projet doit être vide pour pouvoir être supprimé.
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
    </motion.div>
  )
}
