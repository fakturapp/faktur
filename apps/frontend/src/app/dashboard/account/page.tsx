'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import { startRegistration } from '@simplewebauthn/browser'
import { User, Shield, Monitor, Trash2, Smartphone, Copy, Check, Camera, Globe, MapPin, Download, Lock, AlertTriangle, Calendar, Link2, Unlink, Eye, EyeOff, Fingerprint, KeyRound, Plus, ShieldCheck } from 'lucide-react'

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
  const router = useRouter()
  const { user, refreshUser, logout } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Email change (multi-step)
  const [emailStep, setEmailStep] = useState<'idle' | 'verify_current' | 'enter_new' | 'verify_new'>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [emailChangeLoading, setEmailChangeLoading] = useState(false)
  const [emailCooldown, setEmailCooldown] = useState(0)
  const emailCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Password
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)

  // Delete redirect
  const [deleteRedirectOpen, setDeleteRedirectOpen] = useState(false)

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

  // Providers
  const [providers, setProviders] = useState<{ id: string; provider: string; email: string; displayName: string | null; avatarUrl: string | null; createdAt: string }[]>([])
  const [providersLoaded, setProvidersLoaded] = useState(false)
  const [providerLinking, setProviderLinking] = useState(false)
  const [providerUnlinking, setProviderUnlinking] = useState(false)

  // Passkeys
  const [passkeys, setPasskeys] = useState<{ id: string; friendlyName: string; backedUp: boolean; lastUsedAt: string | null; createdAt: string }[]>([])
  const [passkeysLoaded, setPasskeysLoaded] = useState(false)
  const [passkeyAddOpen, setPasskeyAddOpen] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')
  const [passkeyAdding, setPasskeyAdding] = useState(false)
  const [passkeyDeleteConfirm, setPasskeyDeleteConfirm] = useState<string | null>(null)
  const [passkeyDeleting, setPasskeyDeleting] = useState(false)

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
    } else if (securityAction === 'link_google') {
      executeLinkGoogle()
    } else if (securityAction === 'unlink_google') {
      executeUnlinkGoogle()
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

  // Email cooldown timer
  function startEmailCooldown() {
    setEmailCooldown(60)
    if (emailCooldownRef.current) clearInterval(emailCooldownRef.current)
    emailCooldownRef.current = setInterval(() => {
      setEmailCooldown((prev) => {
        if (prev <= 1) {
          if (emailCooldownRef.current) clearInterval(emailCooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function maskEmail(email: string) {
    const [local, domain] = email.split('@')
    if (!domain) return email
    const masked = local.length > 2
      ? local[0] + '***' + local[local.length - 1]
      : local[0] + '***'
    return masked + '@' + domain
  }

  function closeEmailDialog() {
    setEmailStep('idle')
    setNewEmail('')
    setEmailCode('')
    setEmailCodeSent(false)
    setEmailChangeLoading(false)
    setEmailCooldown(0)
    if (emailCooldownRef.current) clearInterval(emailCooldownRef.current)
  }

  // Step 1: Send code to current email
  async function handleEmailSendCurrentCode() {
    setEmailChangeLoading(true)
    const { error } = await api.post('/account/security/send-code', {})
    setEmailChangeLoading(false)
    if (error) return toast(error, 'error')
    setEmailCodeSent(true)
    startEmailCooldown()
    toast('Code envoyé', 'success')
  }

  // Step 1: Verify code from current email
  async function handleEmailVerifyCurrent(e: React.FormEvent) {
    e.preventDefault()
    if (!emailCode.trim()) return
    setEmailChangeLoading(true)
    const { data, error } = await api.post<{ verified: boolean }>('/account/security/verify', { code: emailCode.trim(), method: 'email' })
    setEmailChangeLoading(false)
    if (error) return toast(error, 'error')
    if (data?.verified) {
      setEmailCode('')
      setEmailCodeSent(false)
      setEmailCooldown(0)
      setEmailStep('enter_new')
    }
  }

  // Step 2: Submit new email → move to verify_new
  function handleEmailSubmitNew(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || newEmail === user?.email) return
    setEmailStep('verify_new')
  }

  // Step 3: Send code to new email
  async function handleEmailSendNewCode() {
    setEmailChangeLoading(true)
    const { error } = await api.post('/account/email/request-change', { newEmail })
    setEmailChangeLoading(false)
    if (error) return toast(error, 'error')
    setEmailCodeSent(true)
    startEmailCooldown()
    toast('Code envoyé à ' + newEmail, 'success')
  }

  // Step 3: Verify code from new email → complete
  async function handleEmailConfirmNew(e: React.FormEvent) {
    e.preventDefault()
    if (!emailCode.trim()) return
    setEmailChangeLoading(true)
    const { data, error } = await api.post<{ email: string }>('/account/email/confirm-change', { code: emailCode.trim() })
    setEmailChangeLoading(false)
    if (error) return toast(error, 'error')
    closeEmailDialog()
    await refreshUser()
    toast('Adresse email mise à jour', 'success')
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

  async function loadProviders() {
    const { data } = await api.get<{ providers: typeof providers }>('/account/providers')
    if (data?.providers) {
      setProviders(data.providers)
      setProvidersLoaded(true)
    }
  }

  function handleLinkGoogle() {
    requireSecurity('link_google')
  }

  async function executeLinkGoogle() {
    setProviderLinking(true)
    const { data, error: err } = await api.post<{ url: string }>('/account/providers/link', {})
    if (err || !data?.url) {
      setProviderLinking(false)
      return toast(err || 'Erreur lors de la liaison', 'error')
    }

    // Open popup
    const popup = window.open(data.url, 'google_link', 'width=500,height=600,left=200,top=100')

    // Listen for postMessage from popup
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'oauth_callback') return
      window.removeEventListener('message', onMessage)
      setProviderLinking(false)

      if (event.data.success) {
        toast('Compte Google lié avec succès', 'success')
        loadProviders()
        refreshUser()
      } else {
        const errors: Record<string, string> = {
          already_linked: 'Ce compte Google est déjà lié à un autre utilisateur.',
          provider_exists: 'Vous avez déjà un compte Google lié.',
          oauth_cancelled: 'Liaison annulée.',
          oauth_failed: 'Erreur lors de la liaison avec Google.',
        }
        toast(errors[event.data.error] || 'Erreur lors de la liaison.', 'error')
      }
    }

    window.addEventListener('message', onMessage)

    // Cleanup if popup is closed without completing
    const interval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(interval)
        window.removeEventListener('message', onMessage)
        setProviderLinking(false)
      }
    }, 500)
  }

  function handleUnlinkGoogle() {
    requireSecurity('unlink_google')
  }

  async function executeUnlinkGoogle() {
    setProviderUnlinking(true)
    const { error: err } = await api.post('/account/providers/unlink', { provider: 'google' })
    setProviderUnlinking(false)
    if (err) return toast(err, 'error')
    toast('Compte Google dissocié', 'success')
    loadProviders()
    refreshUser()
  }

  async function loadPasskeys() {
    const { data } = await api.get<{ passkeys: typeof passkeys }>('/account/passkeys')
    if (data?.passkeys) {
      setPasskeys(data.passkeys)
      setPasskeysLoaded(true)
    }
  }

  async function handleAddPasskey() {
    setPasskeyAdding(true)
    try {
      const { data: options, error: optErr } = await api.post<any>('/account/passkeys/register-options', {})
      if (optErr || !options) {
        setPasskeyAdding(false)
        return toast(optErr || 'Erreur lors de la génération des options', 'error')
      }

      const credential = await startRegistration({ optionsJSON: options })

      const { data, error: verifyErr } = await api.post<{ passkey: any }>('/account/passkeys/register-verify', {
        credential,
        friendlyName: passkeyName.trim() || 'Clé d\'accès',
      })
      setPasskeyAdding(false)

      if (verifyErr) return toast(verifyErr, 'error')

      setPasskeyAddOpen(false)
      setPasskeyName('')
      await loadPasskeys()
      await refreshUser()
      toast('Clé d\'accès enregistrée', 'success')
    } catch (err: any) {
      setPasskeyAdding(false)
      if (err.name === 'NotAllowedError') return // User cancelled
      toast('Erreur lors de l\'enregistrement de la clé d\'accès', 'error')
    }
  }

  async function handleDeletePasskey() {
    if (!passkeyDeleteConfirm) return
    setPasskeyDeleting(true)
    const { error } = await api.delete(`/account/passkeys/${passkeyDeleteConfirm}`)
    setPasskeyDeleting(false)
    if (error) {
      setPasskeyDeleteConfirm(null)
      return toast(error, 'error')
    }
    setPasskeys((prev) => prev.filter((p) => p.id !== passkeyDeleteConfirm))
    setPasskeyDeleteConfirm(null)
    await refreshUser()
    toast('Clé d\'accès supprimée', 'success')
  }

  function handleDeleteAccount() {
    setDeleteRedirectOpen(true)
  }


  if (activeTab === 'sessions' && !sessionsLoaded) {
    loadSessions()
  }

  if (activeTab === 'security' && !providersLoaded) {
    loadProviders()
  }

  if (activeTab === 'security' && !passkeysLoaded) {
    loadPasskeys()
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
                <Button variant="outline" size="sm" onClick={() => setEmailStep('verify_current')}>
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
                      <h3 className="font-semibold text-foreground">Authentification à deux facteurs</h3>
                      <p className="text-xs text-muted-foreground">
                        {user?.twoFactorEnabled
                          ? 'La 2FA est activée sur votre compte.'
                          : 'Ajoutez une couche de sécurité supplémentaire.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user?.twoFactorEnabled ? 'success' : 'muted'}>
                      {user?.twoFactorEnabled ? 'Activée' : 'Désactivée'}
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
                        Désactiver
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
                      <FieldLabel htmlFor="twoFactorCode">Code de vérification</FieldLabel>
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
                        Entrez le code à 6 chiffres affiché dans votre application.
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
                        {twoFactorLoading ? <><Spinner /> Vérification...</> : 'Activer'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {twoFactorStep === 'recovery' && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Codes de récupération</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Conservez ces codes en lieu sûr. Ils vous permettront d&apos;accéder à votre compte si vous perdez votre appareil d&apos;authentification.
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
                      J&apos;ai sauvegardé mes codes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Passkeys */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Fingerprint className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Clés d'accès FakturApp</h3>
                    <p className="text-xs text-muted-foreground">Connectez-vous avec l'empreinte digitale, le visage ou un code PIN.</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setPasskeyAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter
                </Button>
              </div>

              {passkeys.length === 0 ? (
                <div className="flex flex-col items-center text-center gap-3 py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                    <KeyRound className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aucune clé d'accès enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {passkeys.map((passkey) => (
                    <div
                      key={passkey.id}
                      className="flex items-center justify-between rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                          <KeyRound className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{passkey.friendlyName}</p>
                            {passkey.backedUp && (
                              <Badge variant="default" className="text-[10px]">
                                <ShieldCheck className="h-3 w-3 mr-0.5" /> Synchronisée
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-muted-foreground">
                              Créée le {new Date(passkey.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            {passkey.lastUsedAt && (
                              <p className="text-xs text-muted-foreground">
                                Utilisée le {new Date(passkey.lastUsedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => setPasskeyDeleteConfirm(passkey.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* External connections */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Link2 className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Connexions externes</h3>
                  <p className="text-xs text-muted-foreground">Gérez vos comptes liés pour la connexion rapide.</p>
                </div>
              </div>

              {/* Google provider */}
              {(() => {
                const googleProvider = providers.find((p) => p.provider === 'google')
                return (
                  <div className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Google</p>
                        {googleProvider ? (
                          <p className="text-xs text-muted-foreground">{googleProvider.email}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Non connecté</p>
                        )}
                      </div>
                    </div>
                    {googleProvider ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={handleUnlinkGoogle}
                        disabled={providerUnlinking}
                      >
                        {providerUnlinking ? <Spinner size="sm" /> : <><Unlink className="h-3.5 w-3.5 mr-1.5" /> Dissocier</>}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleLinkGoogle}
                        disabled={providerLinking}
                      >
                        {providerLinking ? <Spinner size="sm" /> : <><Link2 className="h-3.5 w-3.5 mr-1.5" /> Lier</>}
                      </Button>
                    )}
                  </div>
                )
              })()}
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
                  <p className="text-xs text-muted-foreground">Actions irréversibles sur votre compte.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                La suppression de votre compte entraînera la perte définitive de toutes vos données.
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
                  <p className="text-xs text-muted-foreground">Gérez vos sessions de connexion.</p>
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
                                ? `Dernière activité le ${new Date(session.lastUsedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                : `Créée le ${new Date(session.createdAt).toLocaleDateString('fr-FR')}`}
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
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Révoquer
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
                <h3 className="font-semibold text-foreground text-lg">Exporter les données</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Téléchargez toutes les données d&apos;une équipe (factures, devis, clients, paramètres, logos) dans un fichier archive. Vous pouvez optionnellement chiffrer l&apos;export.
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
        <DialogTitle>Révoquer cette session</DialogTitle>
        <DialogDescription>
          Cette session sera déconnectée immédiatement. L&apos;appareil devra se reconnecter.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRevokeConfirm(null)} disabled={revoking}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirmRevokeSession} disabled={revoking}>
            {revoking ? <Spinner size="sm" /> : 'Révoquer'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete account redirect dialog */}
      <Dialog open={deleteRedirectOpen} onClose={() => setDeleteRedirectOpen(false)}>
        <DialogTitle>Supprimer votre compte</DialogTitle>
        <DialogDescription>
          Vous allez être redirigé vers la page de suppression de compte. Ce processus comporte plusieurs étapes de vérification.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteRedirectOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => router.push('/dashboard/account/delete')}
          >
            Continuer
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Email change multi-step dialog */}
      <Dialog open={emailStep !== 'idle'} onClose={closeEmailDialog}>
        {emailStep === 'verify_current' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Vérification d&apos;identité</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Étape 1 sur 3</p>
              </div>
            </div>

            {!emailCodeSent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pour modifier votre adresse email, nous devons d&apos;abord vérifier votre identité. Un code de vérification sera envoyé à <strong>{maskEmail(user?.email || '')}</strong>.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={closeEmailDialog}>Annuler</Button>
                  <Button onClick={handleEmailSendCurrentCode} disabled={emailChangeLoading}>
                    {emailChangeLoading ? <><Spinner /> Envoi...</> : 'Envoyer le code'}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailVerifyCurrent} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Un code à 6 chiffres a été envoyé à <strong>{maskEmail(user?.email || '')}</strong>. Il est valide pendant 5 minutes.
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-[0.3em] font-mono"
                  maxLength={6}
                  autoFocus
                />
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEmailSendCurrentCode}
                    disabled={emailChangeLoading || emailCooldown > 0}
                  >
                    {emailCooldown > 0 ? `Renvoyer (${emailCooldown}s)` : emailChangeLoading ? <><Spinner /> Envoi...</> : 'Renvoyer le code'}
                  </Button>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeEmailDialog}>Annuler</Button>
                  <Button type="submit" disabled={emailChangeLoading || emailCode.length !== 6}>
                    {emailChangeLoading ? <><Spinner /> Vérification...</> : 'Vérifier'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}

        {emailStep === 'enter_new' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Nouvelle adresse email</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Étape 2 sur 3</p>
              </div>
            </div>
            <form onSubmit={handleEmailSubmitNew} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Saisissez la nouvelle adresse email que vous souhaitez utiliser.
              </p>
              <Field>
                <FieldLabel htmlFor="newEmail">Nouvelle adresse email</FieldLabel>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nouvelle@email.com"
                  required
                  autoFocus
                />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEmailDialog}>Annuler</Button>
                <Button type="submit" disabled={!newEmail || newEmail === user?.email}>
                  Continuer
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {emailStep === 'verify_new' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Vérification du nouvel email</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Étape 3 sur 3</p>
              </div>
            </div>

            {!emailCodeSent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Un code de vérification sera envoyé à <strong>{newEmail}</strong> pour confirmer cette adresse.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setEmailStep('enter_new'); setEmailCodeSent(false) }}>Retour</Button>
                  <Button onClick={handleEmailSendNewCode} disabled={emailChangeLoading}>
                    {emailChangeLoading ? <><Spinner /> Envoi...</> : 'Envoyer le code'}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailConfirmNew} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Un code à 6 chiffres a été envoyé à <strong>{newEmail}</strong>. Entrez-le ci-dessous pour confirmer.
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-[0.3em] font-mono"
                  maxLength={6}
                  autoFocus
                />
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEmailSendNewCode}
                    disabled={emailChangeLoading || emailCooldown > 0}
                  >
                    {emailCooldown > 0 ? `Renvoyer (${emailCooldown}s)` : emailChangeLoading ? <><Spinner /> Envoi...</> : 'Renvoyer le code'}
                  </Button>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeEmailDialog}>Annuler</Button>
                  <Button type="submit" disabled={emailChangeLoading || emailCode.length !== 6}>
                    {emailChangeLoading ? <><Spinner /> Vérification...</> : 'Confirmer'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
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

      {/* Add passkey dialog */}
      <Dialog open={passkeyAddOpen} onClose={() => { setPasskeyAddOpen(false); setPasskeyName('') }}>
        <DialogTitle>Ajouter une clé d'accès</DialogTitle>
        <DialogDescription>
          Donnez un nom à cette clé d'accès pour la reconnaître facilement.
        </DialogDescription>
        <div className="mt-4 space-y-4">
          <Field>
            <FieldLabel htmlFor="passkeyName">Nom de la clé</FieldLabel>
            <Input
              id="passkeyName"
              value={passkeyName}
              onChange={(e) => setPasskeyName(e.target.value)}
              placeholder="Ex: MacBook Pro, iPhone..."
              autoFocus
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasskeyAddOpen(false); setPasskeyName('') }} disabled={passkeyAdding}>
              Annuler
            </Button>
            <Button onClick={handleAddPasskey} disabled={passkeyAdding}>
              {passkeyAdding ? <><Spinner /> Enregistrement...</> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete passkey dialog */}
      <Dialog open={!!passkeyDeleteConfirm} onClose={() => setPasskeyDeleteConfirm(null)}>
        <DialogTitle>Supprimer cette clé d'accès</DialogTitle>
        <DialogDescription>
          Vous ne pourrez plus vous connecter avec cette clé d'accès. Cette action est irréversible.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPasskeyDeleteConfirm(null)} disabled={passkeyDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDeletePasskey} disabled={passkeyDeleting}>
            {passkeyDeleting ? <Spinner size="sm" /> : 'Supprimer'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Password change dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => { setPasswordDialogOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false) }}>
        <DialogTitle>Modifier le mot de passe</DialogTitle>
        <DialogDescription>Entrez votre mot de passe actuel puis choisissez un nouveau mot de passe.</DialogDescription>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <Field>
            <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
            <div className="relative">
              <Input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoFocus className="pr-10" />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
            <div className="relative">
              <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { setPasswordDialogOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false) }}>
              Annuler
            </Button>
            <Button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
              {passwordLoading ? <><Spinner /> Modification...</> : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

    </motion.div>
  )
}
