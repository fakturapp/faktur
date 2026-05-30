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
import { Avatar } from '@/components/ui/avatar'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { HiddenUsername } from '@/components/auth/hidden-username'
import { AdminDangerModal } from '@/components/admin/admin-danger-modal'
import { AdminPasswordConfirmModal } from '@/components/admin/admin-password-confirm-modal'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  KeyRound,
  Users as UsersIcon,
  Building2,
  MailCheck,
  MailX,
  ImageOff,
  Eye,
  EyeOff,
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  emailVerified: boolean
  twoFactorEnabled: boolean
  status: 'active' | 'suspended' | 'deleted'
  hasPassword: boolean
  isAdmin: boolean
  teamCount: number
  ownedTeamCount: number
  lastLoginAt: string | null
  createdAt: string
}

function formatDate(iso: string | null): string {
  if (!iso) return 'jamais'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return 'jamais'
  }
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [detail, setDetail] = useState<AdminUser | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', avatarUrl: '', emailVerified: false })
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [verifyTarget, setVerifyTarget] = useState<{ user: AdminUser; next: boolean } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !user.isAdmin) router.replace('/dashboard')
  }, [user, router])

  const load = useCallback(
    async (query: string) => {
      const { data, error } = await api.get<{ users: AdminUser[] }>(
        `/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`
      )
      if (error) toast(error, 'error')
      else if (data?.users) setUsers(data.users)
      setLoading(false)
    },
    [toast]
  )

  useEffect(() => {
    const handle = setTimeout(() => load(q), 300)
    return () => clearTimeout(handle)
  }, [q, load])

  if (!user?.isAdmin) return null

  function copyEmail(u: AdminUser) {
    navigator.clipboard.writeText(u.email)
    setCopiedId(u.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  function openDetail(u: AdminUser) {
    setDetail(u)
    setForm({
      fullName: u.fullName ?? '',
      email: u.email,
      avatarUrl: u.avatarUrl ?? '',
      emailVerified: u.emailVerified,
    })
    setAdminPassword('')
    setShowPassword(false)
    setSaveError(null)
  }

  async function handleSave() {
    if (!detail || !adminPassword || saving) return
    setSaving(true)
    setSaveError(null)
    const { error } = await api.put(`/admin/users/${detail.id}`, {
      password: adminPassword,
      fullName: form.fullName.trim() || null,
      email: form.email.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      emailVerified: form.emailVerified,
    })
    setSaving(false)
    if (error) {
      setSaveError(error)
      return
    }
    toast('Utilisateur mis à jour', 'success')
    setDetail(null)
    load(q)
  }

  async function handleDelete(password: string) {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await api.delete(`/admin/users/${deleteTarget.id}`, {
      password,
      confirmEmail: deleteTarget.email,
    })
    setDeleting(false)
    if (error) {
      setDeleteError(error)
      return
    }
    toast('Utilisateur supprimé définitivement', 'success')
    setDeleteTarget(null)
    load(q)
  }

  async function handleQuickVerify(password: string) {
    if (!verifyTarget) return
    setVerifying(true)
    setVerifyError(null)
    const { error } = await api.put(`/admin/users/${verifyTarget.user.id}`, {
      password,
      emailVerified: verifyTarget.next,
    })
    setVerifying(false)
    if (error) {
      setVerifyError(error)
      return
    }
    toast(verifyTarget.next ? 'Email confirmé' : 'Email dévalidé', 'success')
    setVerifyTarget(null)
    load(q)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {users.length} compte{users.length !== 1 ? 's' : ''}. Cliquez sur un utilisateur pour
          gérer son profil, valider son email ou supprimer son compte.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par email ou nom…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <UsersIcon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Aucun utilisateur</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Aucun compte ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AnimatePresence>
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: Math.min(i * 0.015, 0.25) }}
                onClick={() => openDetail(u)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-surface-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar
                      src={u.avatarUrl}
                      alt={u.fullName || u.email}
                      fallback={(u.fullName || u.email).slice(0, 2).toUpperCase()}
                      size="md"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                        u.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      title={u.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {u.fullName || u.email.split('@')[0]}
                      </h3>
                      {u.isAdmin && (
                        <Badge variant="warning" className="text-[10px]">
                          <ShieldCheck className="mr-1 h-3 w-3" /> Admin
                        </Badge>
                      )}
                      {u.twoFactorEnabled && (
                        <Badge variant="success" className="text-[10px]">
                          <KeyRound className="mr-1 h-3 w-3" /> 2FA
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" /> {u.teamCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {u.ownedTeamCount}
                      </span>
                      <span>Inscrit le {formatDate(u.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {!u.emailVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                        onClick={() => {
                          setVerifyError(null)
                          setVerifyTarget({ user: u, next: true })
                        }}
                      >
                        <MailCheck className="mr-1.5 h-3.5 w-3.5" /> Confirmer
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => copyEmail(u)} title="Copier l'email">
                      {copiedId === u.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!detail} onClose={() => !saving && setDetail(null)}>
        <DialogHeader onClose={() => !saving && setDetail(null)}>
          <DialogTitle>Gérer l&apos;utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez le profil, validez l&apos;email ou supprimez le compte. Chaque changement est
            confirmé par votre mot de passe administrateur.
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <Avatar
                src={form.avatarUrl || null}
                alt={form.fullName || detail.email}
                fallback={(form.fullName || detail.email).slice(0, 2).toUpperCase()}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{detail.email}</p>
                <p className="text-xs text-muted-foreground">
                  Inscrit le {formatDate(detail.createdAt)}, dernière connexion {formatDate(detail.lastLoginAt)}
                </p>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="admin-user-name">Pseudo</FieldLabel>
              <Input
                id="admin-user-name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Nom complet"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-user-email">Email</FieldLabel>
              <Input
                id="admin-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemple.com"
                disabled={detail.isAdmin}
              />
              {detail.isAdmin && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  L&apos;email d&apos;un administrateur ne peut pas être modifié.
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-user-avatar">Photo de profil (URL)</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="admin-user-avatar"
                  value={form.avatarUrl}
                  onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://…"
                />
                {form.avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}
                    title="Retirer la photo"
                  >
                    <ImageOff className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Field>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, emailVerified: !f.emailVerified }))}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/40"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  form.emailVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {form.emailVerified ? <MailCheck className="h-4 w-4" /> : <MailX className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {form.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.emailVerified
                    ? 'Cliquez pour dévalider l’email du compte.'
                    : 'Cliquez pour confirmer l’email du compte.'}
                </p>
              </div>
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  form.emailVerified ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    form.emailVerified ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>

            <Field>
              <FieldLabel htmlFor="admin-save-password">Mot de passe administrateur</FieldLabel>
              <HiddenUsername />
              <div className="relative">
                <Input
                  id="admin-save-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Confirmez avec votre mot de passe"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {saveError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={detail.isAdmin || saving}
                title={detail.isAdmin ? 'Impossible de supprimer un administrateur' : 'Supprimer ce compte'}
                onClick={() => {
                  const target = detail
                  setDetail(null)
                  setDeleteError(null)
                  setDeleteTarget(target)
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDetail(null)} disabled={saving}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving || !adminPassword || form.email.trim().length < 3}>
                  {saving ? (
                    <>
                      <Spinner /> Enregistrement…
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <AdminPasswordConfirmModal
        open={!!verifyTarget}
        onClose={() => {
          if (!verifying) {
            setVerifyTarget(null)
            setVerifyError(null)
          }
        }}
        title={verifyTarget?.next ? "Confirmer l'email" : "Dévalider l'email"}
        description={
          verifyTarget?.next ? (
            <>
              Confirmer l&apos;email de{' '}
              <strong className="text-foreground">{verifyTarget?.user.email}</strong> sans
              vérification par le propriétaire.
            </>
          ) : (
            <>
              Marquer l&apos;email de{' '}
              <strong className="text-foreground">{verifyTarget?.user.email}</strong> comme non
              vérifié.
            </>
          )
        }
        submitLabel={verifyTarget?.next ? "Confirmer l'email" : 'Dévalider'}
        submitting={verifying}
        error={verifyError}
        onConfirm={handleQuickVerify}
      />

      <AdminDangerModal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
        title="Supprimer cet utilisateur"
        description={
          <>
            Le compte <strong className="text-foreground">{deleteTarget?.email}</strong> sera
            supprimé définitivement.
          </>
        }
        confirmValue={deleteTarget?.email ?? ''}
        confirmLabel="Tapez l'email de l'utilisateur pour confirmer"
        confirmPlaceholder={deleteTarget?.email}
        warning="Action irréversible. Les équipes que cet utilisateur possède seront également supprimées avec toutes leurs données."
        submitLabel="Supprimer le compte"
        submitting={deleting}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  )
}
