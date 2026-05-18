'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Trash2, AlertTriangle } from 'lucide-react'
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
import { EditableField } from '@/components/ui/editable-field'
import { useToast } from '@/components/ui/toast'
import { apiProjectsClient, type ApiProjectShape } from '@/lib/api-projects-client'
import { useProjects } from '@/lib/projects-context'

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { reload: reloadProjects } = useProjects()

  const [project, setProject] = useState<ApiProjectShape | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    apiProjectsClient.show(params.id).then((res) => {
      if (res.data?.data) {
        setProject(res.data.data)
      }
    })
  }, [params.id])

  async function saveField(patch: { name?: string; description?: string | null }): Promise<boolean> {
    if (!project) return false
    const res = await apiProjectsClient.update(project.id, patch)
    if (res.error || !res.data?.data) {
      toast(res.error || 'Échec de la mise à jour', 'error')
      return false
    }
    setProject(res.data.data)
    reloadProjects()
    toast('Projet mis à jour', 'success')
    return true
  }

  async function handleDelete() {
    if (!project) return
    if (!password) {
      toast('Mot de passe requis', 'error')
      return
    }
    setDeleting(true)
    const res = await apiProjectsClient.destroy(project.id, password)
    setDeleting(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Projet supprimé', 'success')
    setConfirmDelete(false)
    setPassword('')
    setConfirmText('')
    reloadProjects()
    router.replace('/projects')
  }

  function closeDeleteModal() {
    if (deleting) return
    setConfirmDelete(false)
    setPassword('')
    setConfirmText('')
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
      className="space-y-6 px-4 lg:px-6 pt-16 md:pt-20 pb-12 max-w-3xl mx-auto w-full"
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
          <EditableField
            label="Nom"
            value={project.name}
            required
            disabled={project.is_default}
            disabledHint="Le projet par défaut ne peut pas être renommé."
            modalTitle="Renommer le projet"
            placeholder="Production app mobile"
            onSave={(next) => saveField({ name: next })}
          />
          <EditableField
            label="Description"
            value={project.description ?? null}
            placeholder="Aucune description"
            modalTitle="Modifier la description"
            type="textarea"
            onSave={(next) => saveField({ description: next || null })}
          />
        </CardContent>
      </Card>

      <Card className={project.is_default ? 'border-border/50' : 'border-danger/30 bg-danger/5'}>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Zone dangereuse</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.is_default
              ? 'Ce projet ne peut pas être supprimé car il s’agit du projet par défaut de votre équipe.'
              : 'La suppression est définitive. Le projet doit être vide (aucune clé active) pour pouvoir être supprimé.'}
          </p>
          <div className="mt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting || project.is_default}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Supprimer le projet
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onClose={closeDeleteModal} className="max-w-md">
        <DialogHeader showClose={false}>
          <DialogTitle className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-5 w-5" />
            Supprimer « {project.name} » ?
          </DialogTitle>
          <DialogDescription>
            Cette action est <strong>définitive</strong>. Toutes les références au projet
            seront perdues. Le projet doit être vide (aucune clé active) pour pouvoir être supprimé.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-1">
          <Field>
            <FieldLabel htmlFor="confirm-name">
              Tape <strong>« {project.name} »</strong> pour confirmer
            </FieldLabel>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={project.name}
              disabled={deleting}
              autoFocus
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Mot de passe Faktur</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={deleting}
              autoComplete="current-password"
            />
            <FieldDescription>
              Pour des raisons de sécurité, votre mot de passe est requis.
            </FieldDescription>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeDeleteModal} disabled={deleting}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting || confirmText !== project.name || !password}
          >
            {deleting ? (
              <>
                <Spinner />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
