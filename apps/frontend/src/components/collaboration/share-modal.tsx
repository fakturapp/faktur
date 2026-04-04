'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  Link2, Copy, Check, Mail, X, UserPlus, Globe,
  ChevronDown, Shield, Eye, Pencil, Trash2, Users
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

type DocumentType = 'invoice' | 'quote' | 'credit_note'
type Permission = 'viewer' | 'editor'

interface ShareEntry {
  id: string
  permission: Permission
  status: 'active' | 'pending'
  sharedWithEmail: string | null
  sharedWith: {
    id: string
    fullName: string | null
    email: string
    avatarUrl: string | null
  } | null
  sharedBy: { id: string; fullName: string | null }
  createdAt: string
}

interface ShareLinkEntry {
  id: string
  token: string
  permission: Permission
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

interface ShareModalProps {
  open: boolean
  onClose: () => void
  documentType: DocumentType
  documentId: string
}

const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : ''

// ── Helpers ───────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

const permissionLabels: Record<Permission, string> = {
  viewer: 'Lecture seule',
  editor: 'Peut modifier',
}

const permissionIcons: Record<Permission, typeof Eye> = {
  viewer: Eye,
  editor: Pencil,
}

// ── Component ─────────────────────────────────────────────────────────────

export function ShareModal({ open, onClose, documentType, documentId }: ShareModalProps) {
  const { toast } = useToast()

  // State
  const [shares, setShares] = useState<ShareEntry[]>([])
  const [links, setLinks] = useState<ShareLinkEntry[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState<Permission>('viewer')
  const [linkPermission, setLinkPermission] = useState<Permission>('viewer')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)

  // ── Fetch shares and links ──────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!documentId) return
    setLoading(true)

    const [sharesRes, linksRes] = await Promise.all([
      api.get<{ data: ShareEntry[] }>(`/collaboration/shares/${documentType}/${documentId}`),
      api.get<{ data: ShareLinkEntry[] }>(`/collaboration/share-links/${documentType}/${documentId}`),
    ])

    if (sharesRes.data) setShares(sharesRes.data.data)
    if (linksRes.data) setLinks(linksRes.data.data)
    setLoading(false)
  }, [documentId, documentType])

  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  // ── Share link ──────────────────────────────────────────────────────

  const activeLink = links[0] // Show the most recent active link

  const createShareLink = async () => {
    const { data, error } = await api.post<{ data: ShareLinkEntry }>('/collaboration/share-links', {
      documentType,
      documentId,
      permission: linkPermission,
    })
    if (error) {
      toast(error, 'error')
      return
    }
    if (data) {
      setLinks((prev) => [data.data, ...prev])
      toast('Lien de partage cree', 'success')
    }
  }

  const copyLink = async (token: string) => {
    const url = `${FRONTEND_URL}/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast('Lien copie dans le presse-papiers', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const deleteShareLink = async (linkId: string) => {
    await api.delete(`/collaboration/share-links/${linkId}`)
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
    toast('Lien desactive', 'success')
  }

  // ── Invite by email ─────────────────────────────────────────────────

  const inviteByEmail = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)

    const { data, error } = await api.post<{ data: ShareEntry }>('/collaboration/shares', {
      documentType,
      documentId,
      email: inviteEmail.trim(),
      permission: invitePermission,
    })

    if (error) {
      toast(error, 'error')
    } else if (data) {
      setShares((prev) => [data.data, ...prev])
      setInviteEmail('')
      toast('Invitation envoyee', 'success')
    }
    setInviting(false)
  }

  // ── Update permission ───────────────────────────────────────────────

  const updatePermission = async (shareId: string, permission: Permission) => {
    const { error } = await api.patch(`/collaboration/shares/${shareId}`, { permission })
    if (error) {
      toast(error, 'error')
      return
    }
    setShares((prev) =>
      prev.map((s) => (s.id === shareId ? { ...s, permission } : s))
    )
  }

  // ── Revoke access ───────────────────────────────────────────────────

  const revokeAccess = async (shareId: string) => {
    const { error } = await api.delete(`/collaboration/shares/${shareId}`)
    if (error) {
      toast(error, 'error')
      return
    }
    setShares((prev) => prev.filter((s) => s.id !== shareId))
    toast('Acces revoque', 'success')
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Partager
      </DialogTitle>

      <div className="mt-4 space-y-5">
        {/* ── Invite by email ──────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Inviter par email
          </label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@exemple.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inviteByEmail()}
              className="flex-1"
            />
            <Select
              value={invitePermission}
              onChange={(e) => setInvitePermission(e.target.value as Permission)}
              className="w-[140px]"
            >
              <option value="viewer">Lecture seule</option>
              <option value="editor">Peut modifier</option>
            </Select>
            <Button
              onClick={inviteByEmail}
              disabled={!inviteEmail.trim() || inviting}
              size="icon"
              title="Inviter"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Share link ───────────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Lien de partage
          </label>

          {activeLink ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2.5">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm text-muted-foreground">
                {FRONTEND_URL}/share/{activeLink.token.slice(0, 12)}...
              </span>
              <Select
                value={activeLink.permission}
                onChange={async (e) => {
                  const perm = e.target.value as Permission
                  await api.patch(`/collaboration/share-links/${activeLink.id}`, { permission: perm })
                  setLinks((prev) =>
                    prev.map((l) => (l.id === activeLink.id ? { ...l, permission: perm } : l))
                  )
                }}
                className="h-8 w-[130px] text-xs"
              >
                <option value="viewer">Lecture seule</option>
                <option value="editor">Peut modifier</option>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyLink(activeLink.token)}
                title="Copier le lien"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteShareLink(activeLink.id)}
                title="Desactiver le lien"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                value={linkPermission}
                onChange={(e) => setLinkPermission(e.target.value as Permission)}
                className="w-[140px]"
              >
                <option value="viewer">Lecture seule</option>
                <option value="editor">Peut modifier</option>
              </Select>
              <Button variant="outline" onClick={createShareLink} className="gap-2">
                <Link2 className="h-4 w-4" />
                Generer un lien
              </Button>
            </div>
          )}
        </div>

        {/* ── Collaborators list ───────────────────────────────────── */}
        {shares.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Personnes ayant acces
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {shares.map((share) => {
                  const name = share.sharedWith?.fullName ?? share.sharedWithEmail ?? '?'
                  const email = share.sharedWith?.email ?? share.sharedWithEmail ?? ''
                  const Icon = permissionIcons[share.permission]
                  return (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/30 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(share.sharedWith?.fullName ?? null, email)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        {share.sharedWith?.fullName && (
                          <p className="text-xs text-muted-foreground truncate">{email}</p>
                        )}
                      </div>

                      {/* Status badge for pending */}
                      {share.status === 'pending' && (
                        <span className="text-[10px] rounded-full bg-amber-500/10 text-amber-500 px-2 py-0.5 font-medium">
                          En attente
                        </span>
                      )}

                      {/* Permission selector */}
                      <Select
                        value={share.permission}
                        onChange={(e) => updatePermission(share.id, e.target.value as Permission)}
                        className="h-7 w-[120px] text-xs"
                      >
                        <option value="viewer">Lecture seule</option>
                        <option value="editor">Peut modifier</option>
                      </Select>

                      {/* Revoke */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => revokeAccess(share.id)}
                        title="Revoquer l'acces"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────── */}
        {shares.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Aucun collaborateur pour le moment
          </p>
        )}
      </div>
    </Dialog>
  )
}
