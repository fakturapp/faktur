'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Tabs } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { SecurityVerificationModal } from '@/components/modals/security-verification-modal'
import { ExportModal } from '@/components/modals/export-modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { User, Shield, Monitor, Trash2, Smartphone, Copy, Check, Camera, Globe, MapPin, Download, Lock, AlertTriangle, Calendar } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
  { id: 'security', label: 'Sécurité', icon: <Shield className="h-4 w-4" /> },
  { id: 'sessions', label: 'Sessions', icon: <Monitor className="h-4 w-4" /> },
  { id: 'export', label: 'Exportation', icon: <Download className="h-4 w-4" /> },
]

interface Session {
  id: string
  isCurrent: boolean
  createdAt: string
  lastUsedAt: string | null
  ipAddress: string | null
  userAgent: string | null
  location?: string | null
}

export default function AccountPage() {
  const { user, refreshUser, logout } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Email change
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailCodeOpen, setEmailCodeOpen] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [emailChangeLoading, setEmailChangeLoading] = useState(false)

  // Password
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Security verification
  const [securityOpen, setSecurityOpen] = useState(false)
  const [securityAction, setSecurityAction] = useState<string | null>(null)
  const [securityVerified, setSecurityVerified] = useState(false)

  // 2FA Setup
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'setup' | 'verify' | 'recovery'>('idle')
  const [qrCode, setQrCode] = useState('')
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // 2FA Disable
  const [disableOpen, setDisableOpen] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)

  function requireSecurity(action: string) {
    setSecurityAction(action)
    setSecurityOpen(true)
  }

  function handleSecurityVerified() {
    setSecurityOpen(false)
    setSecurityVerified(true)

    if (securityAction === 'change_password') {
      executeChangePassword()
    } else if (securityAction === 'setup_2fa') {
      executeSetup2FA()
    } else if (securityAction === 'disable_2fa') {
      setDisableOpen(true)
    } else if (securityAction === 'delete_account') {
      setDeleteOpen(true)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    const { error } = await api.put('/account/profile', { fullName })
    setProfileLoading(false)
    if (error) return toast(error, 'error')
    await refreshUser()
    toast('Profil mis à jour', 'success')
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast('Le fichier ne doit pas dépasser 2 Mo', 'error')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    setAvatarUploading(true)
    try {
      const token = localStorage.getItem('faktur_token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
      const res = await fetch(`${baseUrl}/account/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.message || 'Erreur lors de l\'upload', 'error')
      } else {
        await refreshUser()
        toast('Photo de profil mise à jour', 'success')
      }
    } catch {
      toast('Erreur lors de l\'upload', 'error')
    }
    setAvatarUploading(false)

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRequestEmailChange(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || newEmail === user?.email) return
    setEmailChangeLoading(true)
    const { error } = await api.post('/account/email/request-change', { newEmail })
    setEmailChangeLoading(false)
    if (error) return toast(error, 'error')
    toast('Code envoyé à ' + newEmail, 'success')
    setEmailCodeOpen(true)
  }

  async function handleConfirmEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailChangeLoading(true)
    const { data, error } = await api.post<{ email: string }>('/account/email/confirm-change', { code: emailCode })
    setEmailChangeLoading(false)
    if (error) return toast(error, 'error')
    setEmailCodeOpen(false)
    setEmailCode('')
    setNewEmail('')
    await refreshUser()
    toast('Email mis à jour', 'success')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) return toast('Les mots de passe ne correspondent pas', 'error')
    requireSecurity('change_password')
  }

  async function executeChangePassword() {
    setPasswordLoading(true)
    const { error } = await api.put('/account/password', {
      currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    })
    setPasswordLoading(false)
    if (error) return toast(error, 'error')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSecurityVerified(false)
    toast('Mot de passe modifié', 'success')
  }

  function handleSetup2FA() {
    requireSecurity('setup_2fa')
  }

  async function executeSetup2FA() {
    setTwoFactorLoading(true)
    const { data, error } = await api.post<{ qrCode: string; secret: string }>('/account/2fa/setup', {})
    setTwoFactorLoading(false)

    if (error) return toast(error, 'error')
    if (data) {
      setQrCode(data.qrCode)
      setTwoFactorSecret(data.secret)
      setTwoFactorStep('setup')
    }
  }

  async function handleEnable2FA(e: React.FormEvent) {
    e.preventDefault()
    setTwoFactorLoading(true)
    const { data, error } = await api.post<{ recoveryCodes: string[] }>('/account/2fa/enable', {
      code: twoFactorCode,
    })
    setTwoFactorLoading(false)

    if (error) return toast(error, 'error')
    if (data?.recoveryCodes) {
      setRecoveryCodes(data.recoveryCodes)
      setTwoFactorStep('recovery')
      await refreshUser()
      toast('2FA activée', 'success')
    }
  }

  function handleDisable2FA() {
    requireSecurity('disable_2fa')
  }

  async function executeDisable2FA(e: React.FormEvent) {
    e.preventDefault()
    setDisableLoading(true)
    const { error } = await api.post('/account/2fa/disable', { code: disableCode })
    setDisableLoading(false)
    if (error) return toast(error, 'error')
    setDisableOpen(false)
    setDisableCode('')
    await refreshUser()
    toast('2FA désactivée', 'success')
  }

  function handleCopyRecoveryCodes() {
    navigator.clipboard.writeText(recoveryCodes.join('\n'))
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  async function loadSessions() {
    const { data } = await api.get<{ sessions: Session[] }>('/account/sessions')
    if (data?.sessions) {
      setSessions(data.sessions)
      setSessionsLoaded(true)

      // Fetch location for each unique IP
      const ips = [...new Set(data.sessions.map((s) => s.ipAddress).filter(Boolean))] as string[]
      for (const ip of ips) {
        if (ip === '::1' || ip === '127.0.0.1') continue
        try {
          const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`)
          if (res.ok) {
            const geo = await res.json()
            if (geo.status === 'success') {
              const loc = [geo.city, geo.country].filter(Boolean).join(', ')
              setSessions((prev) =>
                prev.map((s) => (s.ipAddress === ip ? { ...s, location: loc } : s))
              )
            }
          }
        } catch { /* ignore */ }
      }
    }
  }

  async function confirmRevokeSession() {
    if (!revokeConfirm) return
    setRevoking(true)
    const { error } = await api.delete(`/account/sessions/${revokeConfirm}`)
    setRevoking(false)
    if (error) {
      setRevokeConfirm(null)
      return toast(error, 'error')
    }
    setSessions((prev) => prev.filter((s) => String(s.id) !== String(revokeConfirm)))
    setRevokeConfirm(null)
    toast('Session révoquée', 'success')
  }

  function handleDeleteAccount() {
    requireSecurity('delete_account')
  }

  async function executeDeleteAccount() {
    setDeleteLoading(true)
    const { error } = await api.delete('/account', { password: deletePassword })
    setDeleteLoading(false)
    if (error) return toast(error, 'error')
    setDeleteOpen(false)
    logout()
  }


  if (activeTab === 'sessions' && !sessionsLoaded) {
    loadSessions()
  }


  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email.slice(0, 2).toUpperCase() || '??'

  function parseUserAgent(ua: string | null): { browser: string; os: string } {
    if (!ua) return { browser: 'Inconnu', os: 'Inconnu' }
    let browser = 'Navigateur'
    if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg/')) browser = 'Edge'
    else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera'
    else if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Safari')) browser = 'Safari'

    let os = 'Autre'
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

    return { browser, os }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      {/* Page header with user info */}
      <Card className="overflow-hidden">
        <CardContent className="px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="relative group">
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
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {avatarUploading ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{user?.fullName || 'Utilisateur'}</h1>
                {user?.twoFactorEnabled && (
                  <Badge variant="success" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" /> 2FA
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.createdAt && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile}>
                <FieldGroup>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Informations personnelles</h3>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </Field>

                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? <><Spinner /> Enregistrement...</> : 'Enregistrer'}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Adresse email</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password + 2FA combined */}
          <Card>
            <CardContent className="p-6 space-y-0">
              {/* Password row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Lock className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Mot de passe</h3>
                    <p className="text-xs text-muted-foreground">Modifiez votre mot de passe de connexion.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
                  Modifier
                </Button>
              </div>

              <Separator className="my-4" />

              {/* 2FA row */}
              {twoFactorStep === 'idle' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Smartphone className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Authentification a deux facteurs</h3>
                      <p className="text-xs text-muted-foreground">
                        {user?.twoFactorEnabled
                          ? 'La 2FA est activee sur votre compte.'
                          : 'Ajoutez une couche de securite supplementaire.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user?.twoFactorEnabled ? 'success' : 'muted'}>
                      {user?.twoFactorEnabled ? 'Active' : 'Desactive'}
                    </Badge>
                    {!user?.twoFactorEnabled ? (
                      <Button size="sm" onClick={handleSetup2FA} disabled={twoFactorLoading}>
                        {twoFactorLoading ? <Spinner /> : 'Activer'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={handleDisable2FA}
                      >
                        Desactiver
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {twoFactorStep === 'setup' && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Configurer la 2FA</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scannez ce QR code avec votre application d&apos;authentification (Google Authenticator, Authy, etc.)
                  </p>

                  <div className="flex flex-col items-center gap-4 mb-6">
                    {qrCode && (
                      <div className="rounded-xl border border-border p-4 bg-white">
                        <img src={qrCode} alt="QR Code 2FA" className="h-48 w-48" />
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Ou entrez ce code manuellement :</p>
                      <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-lg select-all">
                        {twoFactorSecret}
                      </code>
                    </div>
                  </div>

                  <form onSubmit={handleEnable2FA}>
                    <Field>
                      <FieldLabel htmlFor="twoFactorCode">Code de verification</FieldLabel>
                      <Input
                        id="twoFactorCode"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-xl tracking-[0.3em] font-mono max-w-[200px]"
                        maxLength={6}
                        autoFocus
                      />
                      <FieldDescription>
                        Entrez le code a 6 chiffres affiche dans votre application.
                      </FieldDescription>
                    </Field>

                    <div className="flex gap-3 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setTwoFactorStep('idle')
                          setTwoFactorCode('')
                        }}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={twoFactorLoading || twoFactorCode.length !== 6}>
                        {twoFactorLoading ? <><Spinner /> Verification...</> : 'Activer'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {twoFactorStep === 'recovery' && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Codes de recuperation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Conservez ces codes en lieu sur. Ils vous permettront d&apos;acceder a votre compte si vous perdez votre appareil d&apos;authentification.
                  </p>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {recoveryCodes.map((code) => (
                        <code key={code} className="text-sm font-mono text-foreground text-center py-1">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCopyRecoveryCodes}>
                      {copiedCodes ? (
                        <><Check className="h-4 w-4 mr-2 text-green-500" /> Copie !</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-2" /> Copier les codes</>
                      )}
                    </Button>
                    <Button onClick={() => setTwoFactorStep('idle')}>
                      J&apos;ai sauvegarde mes codes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Zone dangereuse</h3>
                  <p className="text-xs text-muted-foreground">Actions irreversibles sur votre compte.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                La suppression de votre compte entrainera la perte definitive de toutes vos donnees.
              </p>
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer mon compte
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Monitor className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Sessions actives</h3>
                  <p className="text-xs text-muted-foreground">Gerez vos sessions de connexion.</p>
                </div>
              </div>

              <div className="space-y-3">
                {sessions.map((session) => {
                  const isMobile = !!session.userAgent?.match(/Mobile|Android|iPhone/i)
                  const { browser, os } = parseUserAgent(session.userAgent)
                  const DeviceIcon = isMobile ? Smartphone : Monitor

                  return (
                    <div
                      key={session.id}
                      className={`flex items-start justify-between rounded-xl border p-4 gap-4 transition-colors ${
                        session.isCurrent
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5 ${
                          session.isCurrent ? 'bg-primary/10' : 'bg-muted/50'
                        }`}>
                          <DeviceIcon className={`h-5 w-5 ${session.isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground">
                              {browser} sur {os}
                            </p>
                            {session.isCurrent && (
                              <Badge variant="success" className="text-xs">Session actuelle</Badge>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {session.ipAddress && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Globe className="h-3 w-3 shrink-0" />
                                {session.ipAddress}
                                {session.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    {session.location}
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {session.lastUsedAt
                                ? `Derniere activite le ${new Date(session.lastUsedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                : `Creee le ${new Date(session.createdAt).toLocaleDateString('fr-FR')}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => setRevokeConfirm(session.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Revoquer
                        </Button>
                      )}
                    </div>
                  )
                })}
                {sessions.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Spinner size="sm" className="text-primary" />
                    <span className="text-sm text-muted-foreground">Chargement des sessions...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export tab */}
      {activeTab === 'export' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Exporter les donnees</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Telechargez toutes les donnees d&apos;une equipe (factures, devis, clients, parametres, logos) dans un fichier archive. Vous pouvez optionnellement chiffrer l&apos;export.
                </p>
              </div>
              <Button onClick={() => setExportModalOpen(true)} size="lg">
                <Download className="h-4 w-4 mr-2" /> Lancer l&apos;export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export modal */}
      <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />

      {/* Security Verification Modal */}
      <SecurityVerificationModal
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
        onVerified={handleSecurityVerified}
        twoFactorEnabled={user?.twoFactorEnabled}
      />

      {/* Revoke session confirmation */}
      <Dialog open={!!revokeConfirm} onClose={() => setRevokeConfirm(null)}>
        <DialogTitle>Revoquer cette session</DialogTitle>
        <DialogDescription>
          Cette session sera deconnectee immediatement. L&apos;appareil devra se reconnecter.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRevokeConfirm(null)} disabled={revoking}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirmRevokeSession} disabled={revoking}>
            {revoking ? <Spinner size="sm" /> : 'Revoquer'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete account dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Supprimer votre compte</DialogTitle>
        <DialogDescription>
          Cette action est irréversible. Toutes vos données seront perdues. Entrez votre mot de passe pour confirmer.
        </DialogDescription>
        <div className="mt-4">
          <Input
            type="password"
            placeholder="Votre mot de passe"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={executeDeleteAccount}
            disabled={deleteLoading || !deletePassword}
          >
            {deleteLoading ? <><Spinner /> Suppression...</> : 'Supprimer définitivement'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Email verification code dialog */}
      <Dialog open={emailCodeOpen} onClose={() => setEmailCodeOpen(false)}>
        <DialogTitle>Vérification de l&apos;email</DialogTitle>
        <DialogDescription>
          Un code à 6 chiffres a été envoyé à <strong>{newEmail}</strong>. Entrez-le ci-dessous pour confirmer le changement.
        </DialogDescription>
        <form onSubmit={handleConfirmEmailChange} className="mt-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-xl tracking-[0.3em] font-mono"
            maxLength={6}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setEmailCodeOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={emailChangeLoading || emailCode.length !== 6}>
              {emailChangeLoading ? <><Spinner /> Vérification...</> : 'Confirmer'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Disable 2FA dialog */}
      <Dialog open={disableOpen} onClose={() => setDisableOpen(false)}>
        <DialogTitle>Désactiver la 2FA</DialogTitle>
        <DialogDescription>
          Entrez un code de votre application d&apos;authentification pour confirmer la désactivation.
        </DialogDescription>
        <form onSubmit={executeDisable2FA} className="mt-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-xl tracking-[0.3em] font-mono"
            maxLength={6}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDisableOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              disabled={disableLoading || disableCode.length !== 6}
            >
              {disableLoading ? <><Spinner /> Désactivation...</> : 'Désactiver'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Password change dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => { setPasswordDialogOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}>
        <DialogTitle>Modifier le mot de passe</DialogTitle>
        <DialogDescription>Entrez votre mot de passe actuel puis choisissez un nouveau mot de passe.</DialogDescription>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <Field>
            <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
            <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoFocus />
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { setPasswordDialogOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}>
              Annuler
            </Button>
            <Button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
              {passwordLoading ? <><Spinner /> Modification...</> : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Email change dialog */}
      <Dialog open={emailDialogOpen} onClose={() => { setEmailDialogOpen(false); setNewEmail('') }}>
        <DialogTitle>Modifier l&apos;adresse email</DialogTitle>
        <DialogDescription>Un code de verification sera envoye a la nouvelle adresse.</DialogDescription>
        <form onSubmit={handleRequestEmailChange} className="mt-4 space-y-4">
          <Field>
            <FieldLabel htmlFor="newEmail">Nouvelle adresse email</FieldLabel>
            <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nouvelle@email.com" required autoFocus />
          </Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { setEmailDialogOpen(false); setNewEmail('') }}>
              Annuler
            </Button>
            <Button type="submit" disabled={emailChangeLoading || !newEmail || newEmail === user?.email}>
              {emailChangeLoading ? <><Spinner /> Envoi...</> : 'Envoyer le code'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </motion.div>
  )
}
