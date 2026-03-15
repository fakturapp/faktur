'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Eye,
  UserCog,
  Copy,
  Mail,
  Check,
  MoreVertical,
  Trash2,
  ArrowRightLeft,
  Clock,
  X,
  Settings,
  Send,
  ImagePlus,
  Building2 as BuildingIcon,
  Upload,
} from 'lucide-react'

interface TeamMember {
  id: string
  userId: string | null
  role: 'viewer' | 'member' | 'admin' | 'super_admin'
  status: 'active' | 'pending' | 'inactive'
  invitedEmail: string | null
  joinedAt: string | null
  invitedAt: string | null
  user: {
    id: string
    fullName: string | null
    email: string
    avatarUrl: string | null
  } | null
}

interface Team {
  id: string
  name: string
  iconUrl: string | null
  ownerId: string
  members: TeamMember[]
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  member: 'Membre',
  viewer: 'Lecteur',
}

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-3.5 w-3.5" />,
  admin: <Shield className="h-3.5 w-3.5" />,
  member: <UserCog className="h-3.5 w-3.5" />,
  viewer: <Eye className="h-3.5 w-3.5" />,
}

const roleColors: Record<string, string> = {
  super_admin: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  admin: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  member: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  viewer: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
}

export default function TeamPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Invite
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ url: string; token: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Role change
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<string>('member')
  const [roleChanging, setRoleChanging] = useState(false)

  // Transfer
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null)
  const [transferring, setTransferring] = useState(false)

  // Remove
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [removing, setRemoving] = useState(false)

  // Team logo
  const [logoOpen, setLogoOpen] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const currentMember = team?.members.find((m) => m.userId === user?.id)
  const isAdmin = currentMember && ['super_admin', 'admin'].includes(currentMember.role)
  const isSuperAdmin = currentMember?.role === 'super_admin'

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    const { data } = await api.get<{ team: Team }>('/team')
    if (data?.team) {
      setTeam(data.team)
      setName(data.team.name)
    }
    setLoading(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await api.put('/team', { name })
    setSaving(false)
    if (error) return toast(error, 'error')
    toast('Équipe mise à jour', 'success')
    setShowSettings(false)
    loadTeam()
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    const { data, error } = await api.post<{
      invitation: { inviteUrl: string; token: string }
    }>('/team/invite', { email: inviteEmail, role: inviteRole })
    setInviting(false)

    if (error) return toast(error, 'error')
    if (data?.invitation) {
      setInviteResult({ url: data.invitation.inviteUrl, token: data.invitation.token })
      toast('Invitation envoyée', 'success')
      loadTeam()
    }
  }

  function handleCopyLink() {
    if (inviteResult?.url) {
      navigator.clipboard.writeText(inviteResult.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function resetInviteDialog() {
    setInviteOpen(false)
    setInviteEmail('')
    setInviteRole('member')
    setInviteResult(null)
    setCopied(false)
  }

  async function handleRevokeInvite(memberId: string) {
    const { error } = await api.delete(`/team/invite/${memberId}`)
    if (error) return toast(error, 'error')
    toast('Invitation révoquée', 'success')
    loadTeam()
  }

  async function handleChangeRole() {
    if (!roleTarget) return
    setRoleChanging(true)
    const { error } = await api.put(`/team/members/${roleTarget.id}/role`, { role: newRole })
    setRoleChanging(false)
    if (error) return toast(error, 'error')
    toast('Rôle modifié', 'success')
    setRoleDialogOpen(false)
    loadTeam()
  }

  async function handleTransferOwnership() {
    if (!transferTarget) return
    setTransferring(true)
    const { error } = await api.post('/team/transfer-ownership', { memberId: transferTarget.id })
    setTransferring(false)
    if (error) return toast(error, 'error')
    toast('Propriété transférée', 'success')
    setTransferOpen(false)
    loadTeam()
  }

  async function handleRemoveMember() {
    if (!removeTarget) return
    setRemoving(true)
    const { error } = await api.delete(`/team/members/${removeTarget.id}`)
    setRemoving(false)
    if (error) return toast(error, 'error')
    toast('Membre retiré', 'success')
    setRemoveOpen(false)
    loadTeam()
  }

  async function handleUseCompanyLogo() {
    setUploadingIcon(true)
    const { data, error } = await api.post<{ iconUrl: string }>('/team/icon', { useCompanyLogo: true })
    setUploadingIcon(false)
    if (error) return toast(error, 'error')
    toast('Logo mis à jour', 'success')
    setLogoOpen(false)
    loadTeam()
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIcon(true)
    const formData = new FormData()
    formData.append('icon', file)
    const { data, error } = await api.upload<{ iconUrl: string }>('/team/icon', formData)
    setUploadingIcon(false)
    if (error) return toast(error, 'error')
    toast('Logo mis à jour', 'success')
    setLogoOpen(false)
    loadTeam()
  }

  function openRoleDialog(member: TeamMember) {
    setRoleTarget(member)
    setNewRole(member.role)
    setRoleDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        {/* Team header card */}
        <div className="rounded-2xl border border-border/50 overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent" />
          <div className="p-6 -mt-12 flex items-end justify-between">
            <div className="flex items-end gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="space-y-2 mb-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>
        {/* Members section */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="rounded-2xl border border-border/50">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border/50 last:border-b-0">
                <div className="flex items-center gap-3.5">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeMembers = team?.members.filter((m) => m.status === 'active') || []
  const pendingMembers = team?.members.filter((m) => m.status === 'pending') || []
  const totalMembers = activeMembers.length + pendingMembers.length

  const teamInitials = team?.name
    ? team.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'EQ'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      {/* Team Header Card */}
      <Card className="overflow-hidden border-border/50">
        <div className="relative">
          {/* Gradient banner */}
          <div className="h-24 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent" />

          <CardContent className="p-6 -mt-12">
            <input
              ref={iconInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={handleIconUpload}
            />
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-4">
                <button
                  type="button"
                  onClick={() => isAdmin && setLogoOpen(true)}
                  className={`relative group flex h-16 w-16 items-center justify-center rounded-xl border-2 border-background shadow-lg overflow-hidden ${isAdmin ? 'cursor-pointer' : 'cursor-default'} ${team?.iconUrl ? 'bg-white' : 'bg-zinc-800'}`}
                >
                  {team?.iconUrl ? (
                    <img
                      src={team.iconUrl}
                      alt={team.name}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-lg font-bold text-foreground">{teamInitials}</span>
                  )}
                  {isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <ImagePlus className="h-5 w-5 text-white" />
                    </div>
                  )}
                </button>
                <div className="mb-1">
                  <h1 className="text-xl font-bold text-foreground">{team?.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {totalMembers} membre{totalMembers > 1 ? 's' : ''}
                    {pendingMembers.length > 0 && (
                      <span className="text-amber-400/80"> &middot; {pendingMembers.length} en attente</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4 mr-2" /> Paramètres
                    </Button>
                    <Button size="sm" onClick={() => setInviteOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" /> Inviter
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Inline settings */}
            <AnimatePresence>
              {showSettings && isAdmin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Separator className="my-5" />
                  <form onSubmit={handleUpdate} className="flex items-end gap-3">
                    <div className="flex-1">
                      <Field>
                        <FieldLabel htmlFor="teamName">Nom de l&apos;équipe</FieldLabel>
                        <Input
                          id="teamName"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nom de votre équipe"
                        />
                      </Field>
                    </div>
                    <Button type="submit" disabled={saving || name === team?.name} size="sm">
                      {saving ? <><Spinner /> Enregistrement...</> : 'Enregistrer'}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </div>
      </Card>

      {/* Members Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Membres
          </h2>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {activeMembers.map((member, index) => {
                const memberUser = member.user
                const initials = memberUser?.fullName
                  ? memberUser.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                  : memberUser?.email.slice(0, 2).toUpperCase() || '??'

                const canManage =
                  isAdmin &&
                  member.userId !== user?.id &&
                  member.role !== 'super_admin' &&
                  (isSuperAdmin || member.role !== 'admin')

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        src={memberUser?.avatarUrl}
                        alt={memberUser?.fullName || memberUser?.email || ''}
                        fallback={initials}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {memberUser?.fullName || memberUser?.email}
                          </p>
                          {member.userId === user?.id && (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                              vous
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {memberUser?.fullName ? memberUser.email : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${roleColors[member.role]}`}
                      >
                        {roleIcons[member.role]}
                        {roleLabels[member.role]}
                      </div>

                      {canManage && (
                        <Dropdown
                          trigger={
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          }
                        >
                          <DropdownItem onClick={() => openRoleDialog(member)}>
                            <UserCog className="h-4 w-4" /> Changer le rôle
                          </DropdownItem>
                          {isSuperAdmin && (
                            <DropdownItem
                              onClick={() => {
                                setTransferTarget(member)
                                setTransferOpen(true)
                              }}
                            >
                              <ArrowRightLeft className="h-4 w-4" /> Transférer la propriété
                            </DropdownItem>
                          )}
                          <DropdownSeparator />
                          <DropdownItem
                            destructive
                            onClick={() => {
                              setRemoveTarget(member)
                              setRemoveOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Retirer
                          </DropdownItem>
                        </Dropdown>
                      )}
                    </div>
                  </motion.div>
                )
              })}

              {activeMembers.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Aucun membre actif.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Send className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Invitations en attente
            </h2>
          </div>

          <Card className="border-border/50 border-dashed">
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {pendingMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/20">
                        <Clock className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.invitedEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          Invité le{' '}
                          {member.invitedAt
                            ? new Date(member.invitedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${roleColors[member.role]}`}
                      >
                        {roleIcons[member.role]}
                        {roleLabels[member.role]}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleRevokeInvite(member.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Révoquer l'invitation"
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onClose={resetInviteDialog}>
        {!inviteResult ? (
          <>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour ajouter un membre à votre équipe.
            </DialogDescription>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <Field>
                <FieldLabel htmlFor="inviteEmail">Adresse email</FieldLabel>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="collaborateur@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="inviteRole">Rôle</FieldLabel>
                <Select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="viewer">Lecteur - Consultation en lecture seule</option>
                  <option value="member">Membre - Créer des factures et devis</option>
                  <option value="admin">Administrateur - Gestion des membres</option>
                </Select>
              </Field>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={resetInviteDialog}>
                  Annuler
                </Button>
                <Button type="submit" disabled={inviting || !inviteEmail}>
                  {inviting ? (
                    <><Spinner /> Envoi...</>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" /> Envoyer l&apos;invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogTitle>Invitation envoyée</DialogTitle>
            <DialogDescription>
              Un email d&apos;invitation a été envoyé à <strong>{inviteEmail}</strong>. Vous pouvez
              également partager le lien ci-dessous.
            </DialogDescription>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input value={inviteResult.url} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <DialogFooter>
                <Button onClick={resetInviteDialog}>Fermer</Button>
              </DialogFooter>
            </div>
          </>
        )}
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Changer le rôle</DialogTitle>
        <DialogDescription>
          Modifier le rôle de{' '}
          <strong>{roleTarget?.user?.fullName || roleTarget?.user?.email}</strong>.
        </DialogDescription>

        <div className="mt-4">
          <Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            <option value="viewer">Lecteur</option>
            <option value="member">Membre</option>
            {isSuperAdmin && <option value="admin">Administrateur</option>}
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleChangeRole} disabled={roleChanging}>
            {roleChanging ? <><Spinner /> Modification...</> : 'Confirmer'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)}>
        <DialogTitle>Transférer la propriété</DialogTitle>
        <DialogDescription>
          Vous êtes sur le point de transférer le rôle de Super Admin à{' '}
          <strong>{transferTarget?.user?.fullName || transferTarget?.user?.email}</strong>. Vous
          serez rétrogradé au rôle d&apos;Administrateur. Cette action est irréversible.
        </DialogDescription>

        <DialogFooter>
          <Button variant="outline" onClick={() => setTransferOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleTransferOwnership}
            disabled={transferring}
          >
            {transferring ? <><Spinner /> Transfert...</> : 'Confirmer le transfert'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeOpen} onClose={() => setRemoveOpen(false)}>
        <DialogTitle>Retirer un membre</DialogTitle>
        <DialogDescription>
          Êtes-vous sûr de vouloir retirer{' '}
          <strong>{removeTarget?.user?.fullName || removeTarget?.user?.email}</strong> de
          l&apos;équipe ? Cette personne n&apos;aura plus accès aux données de l&apos;équipe.
        </DialogDescription>

        <DialogFooter>
          <Button variant="outline" onClick={() => setRemoveOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleRemoveMember}
            disabled={removing}
          >
            {removing ? <><Spinner /> Suppression...</> : 'Retirer'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Team Logo Dialog */}
      <Dialog open={logoOpen} onClose={() => setLogoOpen(false)}>
        <DialogTitle>Logo de l&apos;equipe</DialogTitle>
        <DialogDescription>
          Choisissez comment definir le logo de votre equipe.
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleUseCompanyLogo}
            disabled={uploadingIcon}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BuildingIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Utiliser le logo de l&apos;entreprise</p>
              <p className="text-xs text-muted-foreground">
                Reprendre le logo defini dans les parametres de l&apos;entreprise
              </p>
            </div>
          </button>

          <button
            onClick={() => iconInputRef.current?.click()}
            disabled={uploadingIcon}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Importer un logo</p>
              <p className="text-xs text-muted-foreground">
                Telecharger une image depuis votre ordinateur (PNG, SVG, JPG)
              </p>
            </div>
          </button>

          {uploadingIcon && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Spinner /> <span className="text-sm text-muted-foreground">Mise a jour...</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setLogoOpen(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
