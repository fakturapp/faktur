'use client'

import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useRef, useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import {
  Camera, Shield, Calendar, Globe, KeyRound, ShieldCheck,
  Fingerprint, Link2,
} from 'lucide-react'

interface Provider {
  provider: string
  email: string | null
  createdAt: string
}

interface Passkey {
  id: string
  friendlyName: string
  backedUp: boolean
  createdAt: string
  lastUsedAt: string | null
}

export function AccountPreview() {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loaded, setLoaded] = useState(false)

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email || '').slice(0, 2).toUpperCase()

  useEffect(() => {
    async function load() {
      const [provRes, pkRes] = await Promise.all([
        api.get<{ providers: Provider[] }>('/account/providers'),
        api.get<{ passkeys: Passkey[] }>('/account/passkeys'),
      ])
      if (provRes.data?.providers) setProviders(provRes.data.providers)
      if (pkRes.data?.passkeys) setPasskeys(pkRes.data.passkeys)
      setLoaded(true)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    await api.upload('/account/avatar', formData)
    await refreshUser()
    setAvatarUploading(false)
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="w-[300px] shrink-0 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 sticky top-4">
        {}
        <div className="flex flex-col items-center text-center">
          <div className="relative group mb-3">
            <Avatar
              src={user?.avatarUrl}
              alt={user?.fullName || ''}
              fallback={initials}
              size="lg"
              className="h-20 w-20 text-lg ring-4 ring-card"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors cursor-pointer"
              title="Changer la photo"
            >
              {avatarUploading ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
          <h3 className="text-sm font-bold text-foreground">{user?.fullName || 'Utilisateur'}</h3>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {memberSince && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Membre depuis {memberSince}
            </p>
          )}
        </div>

        <Separator />

        {}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">S&eacute;curit&eacute;</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground">Double authentification</span>
            </div>
            <Badge variant={user?.twoFactorEnabled ? 'success' : 'muted'} className="text-[9px] px-1.5">
              {user?.twoFactorEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {}
        {loaded && providers.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Comptes li&eacute;s</p>
              {providers.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border/50 p-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 shrink-0">
                    {p.provider === 'google' ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    ) : (
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground capitalize">{p.provider}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.email || 'Compte li\u00e9'}
                    </p>
                  </div>
                  <Badge variant="success" className="text-[8px] px-1.5 shrink-0">Li&eacute;</Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {}
        {loaded && passkeys.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cl&eacute;s d&apos;acc&egrave;s</p>
              {passkeys.map((pk) => (
                <div key={pk.id} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                    {pk.backedUp ? (
                      <ShieldCheck className="h-3 w-3 text-green-500" />
                    ) : (
                      <Fingerprint className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{pk.friendlyName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pk.lastUsedAt
                        ? `Utilis\u00e9e ${new Date(pk.lastUsedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                        : `Cr\u00e9\u00e9e ${new Date(pk.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loaded && (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}
