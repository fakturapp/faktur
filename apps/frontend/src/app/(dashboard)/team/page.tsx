'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
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

const roleDescriptions: Record<string, string> = {
  super_admin: 'Acces complet, peut transferer la propriete',
  admin: 'Gestion des membres et parametres',
  member: 'Creer et modifier factures/devis',
  viewer: 'Consultation en lecture seule',
}

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-3.5 w-3.5" />,
  admin: <Shield className="h-3.5 w-3.5" />,
  member: <UserCog className="h-3.5 w-3.5" />,
  viewer: <Eye className="h-3.5 w-3.5" />,
}

const roleBadgeVariants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'muted'> = {
  super_admin: 'default',
  admin: 'warning',
  member: 'muted',
  viewer: 'muted',
}

export default function TeamPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    toast('Equipe mise a jour', 'success')
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
      toast('Invitation envoyee', 'success')
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
    toast('Invitation revoquee', 'success')
    loadTeam()
  }

  async function handleChangeRole() {
    if (!roleTarget) return
    setRoleChanging(true)
    const { error } = await api.put(`/team/members/${roleTarget.id}/role`, { role: newRole })
    setRoleChanging(false)
    if (error) return toast(error, 'error')
    toast('Role modifie', 'success')
    setRoleDialogOpen(false)
    loadTeam()
  }

  async function handleTransferOwnership() {
    if (!transferTarget) return
    setTransferring(true)
    const { error } = await api.post('/team/transfer-ownership', { memberId: transferTarget.id })
    setTransferring(false)
    if (error) return toast(error, 'error')
    toast('Propriete transferee', 'success')
    setTransferOpen(false)
    loadTeam()
  }

  async function handleRemoveMember() {
    if (!removeTarget) return
    setRemoving(true)
    const { error } = await api.delete(`/team/members/${removeTarget.id}`)
    setRemoving(false)
    if (error) return toast(error, 'error')
    toast('Membre retire', 'success')
    setRemoveOpen(false)
    loadTeam()
  }

  function openRoleDialog(member: TeamMember) {
    setRoleTarget(member)
    setNewRole(member.role)
    setRoleDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const activeMembers = team?.members.filter((m) => m.status === 'active') || []
  const pendingMembers = team?.members.filter((m) => m.status === 'pending') || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerez votre equipe et ses membres.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Inviter
          </Button>
        )}
      </div>

      {/* Team settings */}
      {isAdmin && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleUpdate}>
              <FieldGroup>
                <h3 className="font-semibold text-foreground">Informations de l&apos;equipe</h3>

                <Field>
                  <FieldLabel htmlFor="teamName">Nom de l&apos;equipe</FieldLabel>
                  <Input
                    id="teamName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>

                <Button type="submit" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Role legend */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Roles</h3>
          <div className="grid grid-cols-2 gap-3">
            {(['super_admin', 'admin', 'member', 'viewer'] as const).map((role) => (
              <div key={role} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="mt-0.5 text-muted-foreground">{roleIcons[role]}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{roleLabels[role]}</p>
                  <p className="text-xs text-muted-foreground">{roleDescriptions[role]}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Members */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Membres actifs</h3>
              <p className="text-sm text-muted-foreground">{activeMembers.length} membre(s)</p>
            </div>
          </div>

          <div className="space-y-2">
            {activeMembers.map((member) => {
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
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={memberUser?.avatarUrl}
                      alt={memberUser?.fullName || memberUser?.email || ''}
                      fallback={initials}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {memberUser?.fullName || memberUser?.email}
                        {member.userId === user?.id && (
                          <span className="text-xs text-muted-foreground ml-2">(vous)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{memberUser?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={roleBadgeVariants[member.role]}>
                      <span className="flex items-center gap-1">
                        {roleIcons[member.role]}
                        {roleLabels[member.role]}
                      </span>
                    </Badge>

                    {canManage && (
                      <Dropdown
                        trigger={
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        }
                      >
                        <DropdownItem onClick={() => openRoleDialog(member)}>
                          <UserCog className="h-4 w-4" /> Changer le role
                        </DropdownItem>
                        {isSuperAdmin && (
                          <DropdownItem
                            onClick={() => {
                              setTransferTarget(member)
                              setTransferOpen(true)
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4" /> Transferer la propriete
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
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Invitations en attente</h3>
                <p className="text-sm text-muted-foreground">{pendingMembers.length} invitation(s)</p>
              </div>
            </div>

            <div className="space-y-2">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-dashed border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.invitedEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        Invite le {member.invitedAt ? new Date(member.invitedAt).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{roleLabels[member.role]}</Badge>
                    {isAdmin && (
                      <button
                        onClick={() => handleRevokeInvite(member.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onClose={resetInviteDialog}>
        {!inviteResult ? (
          <>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour ajouter un membre a votre equipe.
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
                <FieldLabel htmlFor="inviteRole">Role</FieldLabel>
                <Select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="viewer">Lecteur - Consultation en lecture seule</option>
                  <option value="member">Membre - Creer des factures et devis</option>
                  <option value="admin">Administrateur - Gestion des membres</option>
                </Select>
              </Field>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={resetInviteDialog}>
                  Annuler
                </Button>
                <Button type="submit" disabled={inviting || !inviteEmail}>
                  {inviting ? (
                    'Envoi...'
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
            <DialogTitle>Invitation envoyee</DialogTitle>
            <DialogDescription>
              Un email d&apos;invitation a ete envoye a <strong>{inviteEmail}</strong>. Vous pouvez egalement partager le lien ci-dessous.
            </DialogDescription>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={inviteResult.url}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
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
        <DialogTitle>Changer le role</DialogTitle>
        <DialogDescription>
          Modifier le role de{' '}
          <strong>{roleTarget?.user?.fullName || roleTarget?.user?.email}</strong>.
        </DialogDescription>

        <div className="mt-4">
          <Select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
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
            {roleChanging ? 'Modification...' : 'Confirmer'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)}>
        <DialogTitle>Transferer la propriete</DialogTitle>
        <DialogDescription>
          Vous etes sur le point de transferer le role de Super Admin a{' '}
          <strong>{transferTarget?.user?.fullName || transferTarget?.user?.email}</strong>.
          Vous serez retrogade au role d&apos;Administrateur. Cette action est irreversible.
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
            {transferring ? 'Transfert...' : 'Confirmer le transfert'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeOpen} onClose={() => setRemoveOpen(false)}>
        <DialogTitle>Retirer un membre</DialogTitle>
        <DialogDescription>
          Etes-vous sur de vouloir retirer{' '}
          <strong>{removeTarget?.user?.fullName || removeTarget?.user?.email}</strong> de l&apos;equipe ?
          Cette personne n&apos;aura plus acces aux donnees de l&apos;equipe.
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
            {removing ? 'Suppression...' : 'Retirer'}
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
