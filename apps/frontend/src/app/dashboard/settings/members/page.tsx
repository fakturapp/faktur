'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  AlertTriangle,
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
  member: 'text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20',
  viewer: 'text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20',
}

export default function TeamPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ url: string; token: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [searchResults, setSearchResults] = useState<{ id: string; emailHint: string; fullName: string | null; avatarUrl: string | null }[]>([])
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; emailHint: string; fullName: string | null; avatarUrl: string | null } | null>(null)

  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<string>('member')
  const [roleChanging, setRoleChanging] = useState(false)

  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [transferPassword, setTransferPassword] = useState('')

  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [removing, setRemoving] = useState(false)

  const [logoOpen, setLogoOpen] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleteTeamName, setDeleteTeamName] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

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
    setSelectedUser(null)
    setSearchResults([])
    setShowSuggestions(false)
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
    if (!transferTarget || !transferPassword) return
    setTransferring(true)
    const { error } = await api.post('/team/transfer-ownership', {
      memberId: transferTarget.id,
      password: transferPassword,
    })
    setTransferring(false)
    if (error) return toast(error, 'error')
    toast('Propriété transférée', 'success')
    setTransferOpen(false)
    setTransferPassword('')
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

  async function handleDeleteTeam() {
    setDeleting(true)
    const { data, error } = await api.delete<{ switchedToTeamId: string | null }>('/team', {
      teamName: deleteTeamName,
      password: deletePassword,
    })
    setDeleting(false)
    if (error) return toast(error, 'error')
    toast('Équipe supprimée', 'success')
    setDeleteOpen(false)
    await refreshUser()
    if (data?.switchedToTeamId) {
      router.push('/dashboard')
    } else {
      router.push('/onboarding/team')
    }
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
        <div className="rounded-xl shadow-surface overflow-hidden">
          <div className="p-6 flex items-end justify-between">
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
          <div className="rounded-xl shadow-surface">
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
          <CardContent className="p-6">
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
                  className={`relative group flex h-16 w-16 items-center justify-center rounded-xl border-2 border-background shadow-lg overflow-hidden ${isAdmin ? 'cursor-pointer' : 'cursor-default'} ${team?.iconUrl ? 'bg-white' : 'bg-muted'}`}
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
                    className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors"
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
                            <span className="text-[10px] font-medium text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">
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

      {/* Danger Zone */}
      {isSuperAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-medium text-destructive uppercase tracking-wider">
              Zone de danger
            </h2>
          </div>

          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-destructive">Supprimer l&apos;équipe</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Toutes les factures, devis, clients et données de l&apos;équipe seront supprimés définitivement.
                Cette action est irréversible.
              </p>
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer l&apos;équipe
              </Button>
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

                {selectedUser ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent overflow-hidden">
                      {selectedUser.avatarUrl ? (
                        <img src={selectedUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (selectedUser.fullName || selectedUser.emailHint).slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{selectedUser.fullName || 'Utilisateur'}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.emailHint}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => { setSelectedUser(null); setInviteEmail('') }}
                    >
                      Changer
                    </Button>
                  </motion.div>
                ) : (

                <div className="relative">
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="collaborateur@example.com"
                    value={inviteEmail}
                    onChange={(e) => {
                      const val = e.target.value
                      setInviteEmail(val)
                      if (searchTimeout) clearTimeout(searchTimeout)
                      if (val.length >= 2) {
                        setSearchTimeout(setTimeout(async () => {
                          const { data } = await api.get<{ users: typeof searchResults }>(`/team/search-users?q=${encodeURIComponent(val)}`)
                          if (data?.users) { setSearchResults(data.users); setShowSuggestions(true) }
                        }, 300))
                      } else {
                        setSearchResults([])
                        setShowSuggestions(false)
                      }
                    }}
                    onFocus={() => { if (searchResults.length > 0) setShowSuggestions(true) }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    required
                    autoComplete="off"
                  />
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-overlay shadow-surface overflow-hidden">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-surface-hover transition-colors text-left"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setSelectedUser(u)
                            setInviteEmail(u.emailHint.replace(/\*+/, ''))
                            setShowSuggestions(false)
                            setSearchResults([])
                          }}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent overflow-hidden">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (u.fullName || u.emailHint).slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{u.fullName || 'Utilisateur'}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.emailHint}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                )}
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

        <div className="mt-4">
          <Input
            type="password"
            placeholder="Votre mot de passe"
            value={transferPassword}
            onChange={(e) => setTransferPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && transferPassword) handleTransferOwnership() }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setTransferOpen(false); setTransferPassword('') }}>
            Annuler
          </Button>
          <Button
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleTransferOwnership}
            disabled={transferring || !transferPassword}
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

      {/* Delete Team Dialog - Multi-step */}
      <Dialog open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteStep(1); setDeleteTeamName(''); setDeletePassword('') }}>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                s < deleteStep ? 'bg-destructive text-white' : s === deleteStep ? 'bg-destructive/15 text-destructive border-2 border-destructive' : 'bg-muted text-muted-foreground'
              }`}>
                {s < deleteStep ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 rounded-full transition-colors ${s < deleteStep ? 'bg-destructive' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {deleteStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-5.5 w-5.5 text-destructive" />
                </div>
                <div>
                  <DialogTitle className="mb-0">Supprimer l&apos;équipe</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Étape 1 sur 3 — Avertissement</p>
                </div>
              </div>

              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                <p className="text-sm font-medium text-destructive">Cette action est irréversible.</p>
                <p className="text-sm text-muted-foreground">
                  Toutes les données de l&apos;équipe <strong className="text-foreground">{team?.name}</strong> seront supprimées définitivement :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" /> Toutes les factures et devis</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" /> Tous les clients</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" /> Les paramètres et documents</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" /> Les membres seront retirés</li>
                </ul>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteStep(1) }}>
                  Annuler
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteStep(2)}
                >
                  J&apos;ai compris, continuer
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {deleteStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <DialogTitle>Confirmer le nom</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">Étape 2 sur 3 — Vérification</p>

              <Field>
                <FieldLabel htmlFor="deleteTeamName">
                  Tapez <strong className="text-destructive">{team?.name}</strong> pour confirmer
                </FieldLabel>
                <Input
                  id="deleteTeamName"
                  value={deleteTeamName}
                  onChange={(e) => setDeleteTeamName(e.target.value)}
                  placeholder={team?.name || ''}
                  autoFocus
                />
              </Field>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteStep(1)}>
                  Retour
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteStep(3)}
                  disabled={deleteTeamName !== team?.name}
                >
                  Continuer
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {deleteStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <DialogTitle>Mot de passe</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">Étape 3 sur 3 — Authentification</p>

              <Field>
                <FieldLabel htmlFor="deletePassword">Entrez votre mot de passe pour confirmer</FieldLabel>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoFocus
                />
              </Field>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteStep(2)}>
                  Retour
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteTeam}
                  disabled={deleting || !deletePassword}
                >
                  {deleting ? <><Spinner /> Suppression...</> : <><Trash2 className="h-4 w-4 mr-2" /> Supprimer définitivement</>}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Team Logo Dialog */}
      <Dialog open={logoOpen} onClose={() => setLogoOpen(false)}>
        <DialogTitle>Logo de l&apos;équipe</DialogTitle>
        <DialogDescription>
          Choisissez comment définir le logo de votre équipe.
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleUseCompanyLogo}
            disabled={uploadingIcon}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
              <BuildingIcon className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Utiliser le logo de l&apos;entreprise</p>
              <p className="text-xs text-muted-foreground">
                Reprendre le logo défini dans les paramètres de l&apos;entreprise
              </p>
            </div>
          </button>

          <button
            onClick={() => iconInputRef.current?.click()}
            disabled={uploadingIcon}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
              <Upload className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Importer un logo</p>
              <p className="text-xs text-muted-foreground">
                Télécharger une image depuis votre ordinateur (PNG, SVG, JPG)
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
