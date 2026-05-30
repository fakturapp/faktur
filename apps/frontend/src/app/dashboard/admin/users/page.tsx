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
import { AdminDangerModal } from '@/components/admin/admin-danger-modal'
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
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
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

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} compte{users.length !== 1 ? 's' : ''} — consultez, copiez l&apos;email ou
            supprimez un compte.
          </p>
        </div>
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
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    src={u.avatarUrl}
                    alt={u.fullName || u.email}
                    fallback={(u.fullName || u.email).slice(0, 2).toUpperCase()}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                      {u.status !== 'active' && (
                        <Badge variant="destructive" className="text-[10px]">
                          {u.status}
                        </Badge>
                      )}
                      {!u.emailVerified && (
                        <Badge variant="muted" className="text-[10px]">
                          Email non vérifié
                        </Badge>
                      )}
                    </div>

                    <button
                      onClick={() => copyEmail(u)}
                      className="group mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="truncate">{u.email}</span>
                      {copiedId === u.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                      )}
                    </button>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" /> {u.teamCount} équipe
                        {u.teamCount !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {u.ownedTeamCount} possédée
                        {u.ownedTeamCount !== 1 ? 's' : ''}
                      </span>
                      <span>Inscrit le {formatDate(u.createdAt)}</span>
                      <span>Dernière connexion : {formatDate(u.lastLoginAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyEmail(u)}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDeleteError(null)
                        setDeleteTarget(u)
                      }}
                      disabled={u.isAdmin}
                      title={u.isAdmin ? 'Impossible de supprimer un administrateur' : 'Supprimer ce compte'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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
