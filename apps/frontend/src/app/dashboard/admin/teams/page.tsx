'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
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
import {
  Search,
  Crown,
  Shield,
  UserCog,
  Eye,
  Lock,
  Cloud,
  Users as UsersIcon,
  Settings,
  Trash2,
  Pencil,
  ChevronRight,
} from 'lucide-react'

interface TeamMemberLite {
  id: string
  userId: string
  role: 'viewer' | 'member' | 'admin' | 'super_admin'
  isOwner: boolean
  fullName: string | null
  email: string | null
  avatarUrl: string | null
}

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
  members: TeamMemberLite[]
  createdAt: string
}

interface Membership {
  team: AdminTeam
  role: TeamMemberLite['role']
  isOwner: boolean
}

interface UserGroup {
  userId: string
  fullName: string | null
  email: string | null
  avatarUrl: string | null
  memberships: Membership[]
}

const ROLE_META: Record<string, { label: string; icon: typeof Crown; cls: string }> = {
  super_admin: { label: 'Propriétaire', icon: Crown, cls: 'text-amber-500 bg-amber-500/10' },
  admin: { label: 'Administrateur', icon: Shield, cls: 'text-indigo-400 bg-indigo-400/10' },
  member: { label: 'Membre', icon: UserCog, cls: 'text-muted-foreground bg-muted' },
  viewer: { label: 'Lecteur', icon: Eye, cls: 'text-muted-foreground bg-muted' },
}

const ROLE_RANK: Record<string, number> = { super_admin: 0, admin: 1, member: 2, viewer: 3 }

const PLAN_OPTIONS = PLAN_IDS.map((id) => ({ value: id, label: PLANS[id].name }))

function roleMetaFor(role: string, isOwner: boolean) {
  return isOwner ? ROLE_META.super_admin : (ROLE_META[role] ?? ROLE_META.member)
}

export default function AdminTeamsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [teams, setTeams] = useState<AdminTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const [detail, setDetail] = useState<AdminTeam | null>(null)

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

  const load = useCallback(async () => {
    const { data, error } = await api.get<{ teams: AdminTeam[] }>('/admin/teams')
    if (error) toast(error, 'error')
    else if (data?.teams) setTeams(data.teams)
    setLoading(false)
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const groups = useMemo<UserGroup[]>(() => {
    const map = new Map<string, UserGroup>()
    for (const team of teams) {
      for (const m of team.members) {
        let g = map.get(m.userId)
        if (!g) {
          g = {
            userId: m.userId,
            fullName: m.fullName,
            email: m.email,
            avatarUrl: m.avatarUrl,
            memberships: [],
          }
          map.set(m.userId, g)
        }
        g.memberships.push({ team, role: m.role, isOwner: m.isOwner })
      }
    }
    const arr = Array.from(map.values())
    for (const g of arr) {
      g.memberships.sort((a, b) => Number(b.isOwner) - Number(a.isOwner))
    }
    arr.sort((a, b) => (a.fullName || a.email || '').localeCompare(b.fullName || b.email || ''))
    return arr
  }, [teams])

  const filteredGroups = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return groups
    return groups
      .map((g) => {
        const userMatch =
          (g.fullName ?? '').toLowerCase().includes(term) ||
          (g.email ?? '').toLowerCase().includes(term)
        if (userMatch) return g
        const memberships = g.memberships.filter((m) => m.team.name.toLowerCase().includes(term))
        return memberships.length ? { ...g, memberships } : null
      })
      .filter((g): g is UserGroup => g !== null)
  }, [groups, q])

  if (!user?.isAdmin) return null

  function openEdit(team: AdminTeam) {
    setDetail(null)
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
    load()
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
    load()
  }

  const detailMembers = detail
    ? [...detail.members].sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role])
    : []
  const detailOwner = detailMembers.find((m) => m.isOwner) ?? detailMembers[0] ?? null
  const detailOthers = detailMembers.filter((m) => m !== detailOwner)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Équipes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue par utilisateur. Cliquez sur une équipe pour voir la hiérarchie, changer le plan ou la
          supprimer.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un utilisateur ou une équipe…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <UsersIcon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Aucune équipe</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Aucun résultat ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {filteredGroups.map((g) => (
            <div key={g.userId}>
              <div className="mb-2 flex items-center gap-2.5 px-1">
                <Avatar
                  src={g.avatarUrl}
                  alt={g.fullName || g.email || 'Utilisateur'}
                  fallback={(g.fullName || g.email || '?').slice(0, 2).toUpperCase()}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {g.fullName || g.email?.split('@')[0] || 'Utilisateur'}
                  </p>
                  {g.email && <p className="truncate text-xs text-muted-foreground">{g.email}</p>}
                </div>
                <span className="ml-auto text-xs text-muted-foreground">
                  {g.memberships.length} équipe{g.memberships.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                <AnimatePresence>
                  {g.memberships.map(({ team, role, isOwner }) => {
                    const planMeta = getPlan(team.plan)
                    const PlanIcon = planMeta.icon
                    const rm = roleMetaFor(role, isOwner)
                    const RoleIcon = rm.icon
                    return (
                      <motion.button
                        key={team.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        onClick={() => setDetail(team)}
                        className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-surface-hover"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-bold text-foreground">
                          {team.iconUrl ? (
                            <img src={team.iconUrl} alt={team.name} className="h-full w-full object-cover" />
                          ) : (
                            team.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{team.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${rm.cls}`}
                            >
                              <RoleIcon className="h-3 w-3" /> {rm.label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${planMeta.accentSoft} ${planMeta.accentText}`}
                            >
                              <PlanIcon className="h-3 w-3" /> {planMeta.name}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onClose={() => setDetail(null)} className="max-w-2xl">
        {detail && (
          <>
            <DialogHeader onClose={() => setDetail(null)}>
              <DialogTitle>{detail.name}</DialogTitle>
              <DialogDescription>Hiérarchie de l&apos;équipe et gestion</DialogDescription>
            </DialogHeader>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${getPlan(detail.plan).accentSoft} ${getPlan(detail.plan).accentText}`}
              >
                Plan {getPlan(detail.plan).name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {detail.encryptionMode === 'private' ? (
                  <>
                    <Lock className="h-3 w-3 text-amber-400" /> Chiffrement Privé
                  </>
                ) : (
                  <>
                    <Cloud className="h-3 w-3 text-accent" /> Chiffrement Standard
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <UsersIcon className="h-3 w-3" /> {detail.memberCount} membre
                {detail.memberCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-border bg-muted/20 p-5">
              {detailOwner ? (
                <div className="flex flex-col items-center">
                  <HierarchyNode member={detailOwner} />
                  {detailOthers.length > 0 && (
                    <>
                      <div className="h-6 w-px bg-border" />
                      <div className="relative flex flex-wrap items-start justify-center gap-x-5 gap-y-7 pt-6">
                        <div className="absolute left-8 right-8 top-0 h-px bg-border" />
                        {detailOthers.map((m) => (
                          <div key={m.id} className="relative flex flex-col items-center">
                            <div className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-border" />
                            <HierarchyNode member={m} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun membre actif.</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const target = detail
                  setDetail(null)
                  setDeleteError(null)
                  setDeleteTarget(target)
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
              </Button>
              <Button onClick={() => openEdit(detail)}>
                <Pencil className="mr-1.5 h-4 w-4" /> Modifier
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

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

function HierarchyNode({ member }: { member: TeamMemberLite }) {
  const rm = member.isOwner ? ROLE_META.super_admin : (ROLE_META[member.role] ?? ROLE_META.member)
  const RoleIcon = rm.icon
  return (
    <div className="flex w-28 flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center shadow-surface">
      <Avatar
        src={member.avatarUrl}
        alt={member.fullName || member.email || 'Membre'}
        fallback={(member.fullName || member.email || '?').slice(0, 2).toUpperCase()}
        size="sm"
      />
      <p className="w-full truncate text-xs font-medium text-foreground">
        {member.fullName || member.email?.split('@')[0] || 'Membre'}
      </p>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${rm.cls}`}
      >
        <RoleIcon className="h-3 w-3" /> {rm.label}
      </span>
    </div>
  )
}
