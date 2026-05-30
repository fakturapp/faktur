'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Field, FieldLabel } from '@/components/ui/field'
import { FormSelect } from '@/components/ui/dropdown'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { AdminDangerModal } from '@/components/admin/admin-danger-modal'
import { getPlan, PLAN_IDS, PLANS, type PlanId } from '@/lib/plans'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Pencil, Trash2, Lock, Cloud, Users as UsersIcon, Settings } from 'lucide-react'

interface AdminTeam {
  id: string
  name: string
  iconUrl: string | null
  plan: PlanId
  encryptionMode: 'private' | 'standard'
  ownerId: string
  ownerEmail: string | null
  ownerName: string | null
  memberCount: number
  createdAt: string
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const PLAN_OPTIONS = PLAN_IDS.map((id) => ({ value: id, label: PLANS[id].name }))

export default function AdminTeamsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [teams, setTeams] = useState<AdminTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const [editTarget, setEditTarget] = useState<AdminTeam | null>(null)
  const [editName, setEditName] = useState('')
  const [editPlan, setEditPlan] = useState<PlanId>('free')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminTeam | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !user.isAdmin) router.replace('/dashboard')
  }, [user, router])

  const load = useCallback(
    async (query: string) => {
      const { data, error } = await api.get<{ teams: AdminTeam[] }>(
        `/admin/teams${query ? `?q=${encodeURIComponent(query)}` : ''}`
      )
      if (error) toast(error, 'error')
      else if (data?.teams) setTeams(data.teams)
      setLoading(false)
    },
    [toast]
  )

  useEffect(() => {
    const handle = setTimeout(() => load(q), 300)
    return () => clearTimeout(handle)
  }, [q, load])

  if (!user?.isAdmin) return null

  function openEdit(team: AdminTeam) {
    setEditTarget(team)
    setEditName(team.name)
    setEditPlan(team.plan)
  }

  async function handleSave() {
    if (!editTarget || editName.trim().length < 2) return
    setSaving(true)
    const { error } = await api.put(`/admin/teams/${editTarget.id}`, {
      name: editName.trim(),
      plan: editPlan,
    })
    setSaving(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Équipe mise à jour', 'success')
    setEditTarget(null)
    load(q)
  }

  async function handleDelete(password: string) {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await api.delete(`/admin/teams/${deleteTarget.id}`, {
      password,
      confirmName: deleteTarget.name,
    })
    setDeleting(false)
    if (error) {
      setDeleteError(error)
      return
    }
    toast('Équipe supprimée définitivement', 'success')
    setDeleteTarget(null)
    load(q)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Équipes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {teams.length} équipe{teams.length !== 1 ? 's' : ''} — renommez, changez le plan ou
            supprimez une équipe.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une équipe…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <UsersIcon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Aucune équipe</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Aucune équipe ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {teams.map((team, i) => {
              const planMeta = getPlan(team.plan)
              const PlanIcon = planMeta.icon
              return (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-sm font-bold text-foreground">
                      {team.iconUrl ? (
                        <img src={team.iconUrl} alt={team.name} className="h-full w-full object-cover" />
                      ) : (
                        team.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">{team.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${planMeta.accentSoft} ${planMeta.accentText}`}
                        >
                          <PlanIcon className="h-3 w-3" /> {planMeta.name}
                        </span>
                        <Badge variant="muted" className="text-[10px]">
                          {team.encryptionMode === 'private' ? (
                            <>
                              <Lock className="mr-1 h-3 w-3" /> Privé
                            </>
                          ) : (
                            <>
                              <Cloud className="mr-1 h-3 w-3" /> Standard
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="truncate">Propriétaire : {team.ownerEmail ?? '—'}</span>
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" /> {team.memberCount} membre
                          {team.memberCount !== 1 ? 's' : ''}
                        </span>
                        <span>Créée le {formatDate(team.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(team)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(team)
                        }}
                        title="Supprimer cette équipe"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit team (name + plan) */}
      <Dialog open={!!editTarget} onClose={() => !saving && setEditTarget(null)}>
        <DialogHeader onClose={() => !saving && setEditTarget(null)} icon={<Settings className="h-5 w-5 text-accent" />}>
          <DialogTitle>Modifier l&apos;équipe</DialogTitle>
          <DialogDescription>
            Renommez l&apos;équipe et choisissez son plan. Le mode de chiffrement n&apos;est pas
            modifiable ici.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="admin-team-name">Nom de l&apos;équipe</FieldLabel>
            <Input
              id="admin-team-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nom de l'équipe"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="admin-team-plan">Plan</FieldLabel>
            <FormSelect
              id="admin-team-plan"
              value={editPlan}
              onChange={(v) => setEditPlan(v as PlanId)}
              options={PLAN_OPTIONS}
            />
          </Field>

          {editTarget && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {editTarget.encryptionMode === 'private' ? (
                <Lock className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Cloud className="h-3.5 w-3.5 text-accent" />
              )}
              Mode de chiffrement :{' '}
              <span className="font-medium text-foreground">
                {editTarget.encryptionMode === 'private' ? 'Privé' : 'Standard'}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || editName.trim().length < 2}>
            {saving ? (
              <>
                <Spinner /> Enregistrement…
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      <AdminDangerModal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
        title="Supprimer cette équipe"
        description={
          <>
            L&apos;équipe <strong className="text-foreground">{deleteTarget?.name}</strong> sera
            supprimée définitivement.
          </>
        }
        confirmValue={deleteTarget?.name ?? ''}
        confirmLabel="Tapez le nom de l'équipe pour confirmer"
        confirmPlaceholder={deleteTarget?.name}
        warning="Action irréversible. Toutes les factures, devis, clients et données de l'équipe seront supprimés."
        submitLabel="Supprimer l'équipe"
        submitting={deleting}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  )
}
