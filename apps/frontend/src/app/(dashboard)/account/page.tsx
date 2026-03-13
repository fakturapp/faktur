'use client'

import { useState } from 'react'
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
import { SecurityVerificationModal } from '@/components/security-verification-modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { User, Shield, Monitor, Trash2, Smartphone, Key, Copy, Check } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
  { id: 'security', label: 'Securite', icon: <Shield className="h-4 w-4" /> },
  { id: 'sessions', label: 'Sessions', icon: <Monitor className="h-4 w-4" /> },
]

interface Session {
  id: string
  isCurrent: boolean
  createdAt: string
  lastUsedAt: string | null
}

export default function AccountPage() {
  const { user, refreshUser, logout } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoaded, setSessionsLoaded] = useState(false)

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

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

    // Execute the pending action
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
    toast('Profil mis a jour', 'success')
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
    toast('Mot de passe modifie', 'success')
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
      toast('2FA activee', 'success')
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
    toast('2FA desactivee', 'success')
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
    }
  }

  async function revokeSession(id: string) {
    const { error } = await api.delete(`/account/sessions/${id}`)
    if (error) return toast(error, 'error')
    setSessions((prev) => prev.filter((s) => String(s.id) !== String(id)))
    toast('Session revoquee', 'success')
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

  // Load sessions on tab switch
  if (activeTab === 'sessions' && !sessionsLoaded) {
    loadSessions()
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email.slice(0, 2).toUpperCase() || '??'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon compte</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerez votre profil et vos parametres de securite.</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleUpdateProfile}>
              <FieldGroup>
                <div className="flex items-center gap-4">
                  <Avatar src={user?.avatarUrl} alt={user?.fullName || ''} fallback={initials} size="lg" />
                  <div>
                    <p className="font-medium text-foreground">{user?.fullName || 'Utilisateur'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <Separator />

                <Field>
                  <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input value={user?.email || ''} disabled />
                  <FieldDescription>L&apos;email ne peut pas etre modifie.</FieldDescription>
                </Field>

                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change password */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleChangePassword}>
                <FieldGroup>
                  <h3 className="font-semibold text-foreground">Changer le mot de passe</h3>

                  <Field>
                    <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Field>

                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* 2FA Section */}
          <Card>
            <CardContent className="p-6">
              {twoFactorStep === 'idle' && (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Authentification a deux facteurs</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {user?.twoFactorEnabled
                            ? 'La 2FA est activee sur votre compte.'
                            : 'Ajoutez une couche de securite supplementaire.'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={user?.twoFactorEnabled ? 'success' : 'muted'}>
                      {user?.twoFactorEnabled ? 'Active' : 'Desactive'}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  {!user?.twoFactorEnabled ? (
                    <Button onClick={handleSetup2FA} disabled={twoFactorLoading}>
                      <Shield className="h-4 w-4 mr-2" />
                      {twoFactorLoading ? 'Chargement...' : 'Activer la 2FA'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={handleDisable2FA}
                    >
                      Desactiver la 2FA
                    </Button>
                  )}
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
                        {twoFactorLoading ? 'Verification...' : 'Activer'}
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
          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-destructive">Zone dangereuse</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                La suppression de votre compte est irreversible.
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
        <Card>
          <CardContent className="p-6">
            <FieldGroup>
              <h3 className="font-semibold text-foreground">Sessions actives</h3>
              <p className="text-sm text-muted-foreground">Gerez vos sessions de connexion.</p>

              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Session {session.isCurrent && <Badge variant="success" className="ml-2">Active</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Creee le {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                      >
                        Revoquer
                      </Button>
                    )}
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
                )}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Security Verification Modal */}
      <SecurityVerificationModal
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
        onVerified={handleSecurityVerified}
        twoFactorEnabled={user?.twoFactorEnabled}
      />

      {/* Delete account dialog (after security verification) */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Supprimer votre compte</DialogTitle>
        <DialogDescription>
          Cette action est irreversible. Toutes vos donnees seront perdues. Entrez votre mot de passe pour confirmer.
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
            {deleteLoading ? 'Suppression...' : 'Supprimer definitivement'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Disable 2FA dialog (after security verification) */}
      <Dialog open={disableOpen} onClose={() => setDisableOpen(false)}>
        <DialogTitle>Desactiver la 2FA</DialogTitle>
        <DialogDescription>
          Entrez un code de votre application d&apos;authentification pour confirmer la desactivation.
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
              {disableLoading ? 'Desactivation...' : 'Desactiver'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </motion.div>
  )
}
