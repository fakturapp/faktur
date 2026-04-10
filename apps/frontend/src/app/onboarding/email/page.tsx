'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  Mail, Check, Plus, ChevronLeft, ChevronRight, Zap, Eye, EyeOff, Key,
  Send, Server, ArrowLeft, X, CheckCircle2, XCircle, ArrowRight,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface EmailAccountItem {
  id: string
  provider: string
  email: string
  displayName: string | null
  isDefault: boolean
}

type ProviderType = 'gmail' | 'resend' | 'smtp'
type DialogStep = 'choose' | 'configure' | 'testing' | 'success' | 'error'

const providerLabel: Record<string, string> = { gmail: 'Gmail', resend: 'Resend', smtp: 'SMTP' }

function OnboardingEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<EmailAccountItem[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<DialogStep>('choose')
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null)
  const [configError, setConfigError] = useState('')

  const [connecting, setConnecting] = useState(false)

  const [resendApiKey, setResendApiKey] = useState('')
  const [resendFromEmail, setResendFromEmail] = useState('')
  const [resendDisplayName, setResendDisplayName] = useState('')
  const [showResendKey, setShowResendKey] = useState(false)

  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFromEmail, setSmtpFromEmail] = useState('')
  const [smtpDisplayName, setSmtpDisplayName] = useState('')
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)

  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [configuring, setConfiguring] = useState(false)
  const [newAccountId, setNewAccountId] = useState<string | null>(null)
  const [newAccountEmail, setNewAccountEmail] = useState('')

  const [sendingTest, setSendingTest] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [sendingTestId, setSendingTestId] = useState<string | null>(null)

  async function loadAccounts() {
    const { data } = await api.get<{ emailAccounts: EmailAccountItem[] }>('/email/accounts')
    if (data?.emailAccounts) setAccounts(data.emailAccounts)
    setLoadingAccounts(false)
  }

  useEffect(() => { loadAccounts() }, [])

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast('Compte Gmail connecté avec succès', 'success')
      loadAccounts()
      window.history.replaceState({}, '', '/onboarding/email')
    }
    if (searchParams.get('error')) {
      const errorMap: Record<string, string> = {
        oauth_cancelled: 'Connexion annulée',
        invalid_state: 'Erreur de sécurité. Veuillez réessayer.',
        oauth_failed: 'Erreur lors de la connexion à Gmail',
      }
      toast(errorMap[searchParams.get('error')!] || 'Une erreur est survenue', 'error')
      window.history.replaceState({}, '', '/onboarding/email')
    }
  }, [searchParams, toast])

  function openDialog() {
    setDialogStep('choose')
    setSelectedProvider(null)
    setConfigError('')
    setTouched({})
    setNewAccountId(null)
    setNewAccountEmail('')
    setTestSent(false)
    resetForms()
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
  }

  function resetForms() {
    setResendApiKey(''); setResendFromEmail(''); setResendDisplayName(''); setShowResendKey(false)
    setSmtpHost(''); setSmtpPort('587'); setSmtpUsername(''); setSmtpPassword('')
    setSmtpFromEmail(''); setSmtpDisplayName(''); setShowSmtpPassword(false)
  }

  function selectProvider(p: ProviderType) {
    setSelectedProvider(p)
    setConfigError('')
    setTouched({})
    if (p === 'gmail') {
      handleConnectGmail()
    } else {
      setDialogStep('configure')
    }
  }

  async function handleConnectGmail() {
    setConnecting(true)
    const { data, error } = await api.get<{ url: string }>('/email/oauth/gmail/url?returnTo=/onboarding/email')
    setConnecting(false)
    if (error || !data?.url) {
      toast(error || 'Erreur', 'error')
      return
    }
    window.location.href = data.url
  }

  function isFieldMissing(field: string, value: string) {
    return touched[field] && !value.trim()
  }

  async function handleConfigure() {
    setConfigError('')

    if (selectedProvider === 'resend') {
      const t: Record<string, boolean> = { resendApiKey: true, resendFromEmail: true }
      setTouched(t)
      if (!resendApiKey.trim() || !resendFromEmail.trim()) {
        setConfigError('Veuillez remplir tous les champs obligatoires')
        return
      }
      setDialogStep('testing')
      setConfiguring(true)
      const { data, error } = await api.post<{ message: string; emailAccount?: { id: string; email: string } }>('/email/resend/configure', {
        apiKey: resendApiKey.trim(),
        fromEmail: resendFromEmail.trim(),
        displayName: resendDisplayName.trim() || undefined,
      })
      setConfiguring(false)
      if (error) {
        setConfigError(error)
        setDialogStep('error')
        return
      }
      setNewAccountId(data?.emailAccount?.id || null)
      setNewAccountEmail(data?.emailAccount?.email || resendFromEmail)
      setDialogStep('success')
      loadAccounts()
    }

    if (selectedProvider === 'smtp') {
      const t: Record<string, boolean> = { smtpHost: true, smtpUsername: true, smtpPassword: true, smtpFromEmail: true }
      setTouched(t)
      if (!smtpHost.trim() || !smtpUsername.trim() || !smtpPassword.trim() || !smtpFromEmail.trim()) {
        setConfigError('Veuillez remplir tous les champs obligatoires')
        return
      }
      setDialogStep('testing')
      setConfiguring(true)
      const { data, error } = await api.post<{ message: string; emailAccount?: { id: string; email: string } }>('/email/smtp/configure', {
        host: smtpHost.trim(),
        port: Number(smtpPort) || 587,
        username: smtpUsername.trim(),
        password: smtpPassword.trim(),
        fromEmail: smtpFromEmail.trim(),
        displayName: smtpDisplayName.trim() || undefined,
      })
      setConfiguring(false)
      if (error) {
        setConfigError(error)
        setDialogStep('error')
        return
      }
      setNewAccountId(data?.emailAccount?.id || null)
      setNewAccountEmail(data?.emailAccount?.email || smtpFromEmail)
      setDialogStep('success')
      loadAccounts()
    }
  }

  async function handleSendTestFromDialog() {
    if (!newAccountId) return
    setSendingTest(true)
    const { error } = await api.post('/email/test', { emailAccountId: newAccountId })
    setSendingTest(false)
    if (error) {
      toast(error, 'error')
      return
    }
    setTestSent(true)
    toast(`Email de test envoyé à ${newAccountEmail}`, 'success')
  }

  async function handleSendTest(accountId: string, email: string) {
    setSendingTestId(accountId)
    const { error } = await api.post('/email/test', { emailAccountId: accountId })
    setSendingTestId(null)
    if (error) { toast(error, 'error'); return }
    toast(`Email de test envoyé à ${email}`, 'success')
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
              <Mail className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Configurez votre email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Connectez un compte email pour envoyer vos factures et devis
                directement depuis l&apos;application.
              </p>
            </div>
          </motion.div>

          {/* Connected accounts */}
          <motion.div variants={fadeUp} custom={1} className="mb-6">
            {loadingAccounts ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-lg skeleton-shimmer" />
                ))}
              </div>
            ) : accounts.length > 0 ? (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Comptes connectés
                </p>
                <div className="space-y-2">
                  {accounts.map((acc, i) => (
                    <motion.div
                      key={acc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                        <Check className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{acc.email}</p>
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                            {providerLabel[acc.provider] || acc.provider}
                          </span>
                          {acc.isDefault && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                              Par défaut
                            </span>
                          )}
                        </div>
                        {acc.displayName && (
                          <p className="text-xs text-muted-foreground truncate">{acc.displayName}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleSendTest(acc.id, acc.email)}
                        disabled={sendingTestId === acc.id}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                        title="Envoyer un email de test"
                      >
                        {sendingTestId === acc.id ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center">
                <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun compte email configuré
                </p>
                <p className="text-xs text-muted-secondary mt-1">
                  Ajoutez un fournisseur pour commencer à envoyer des emails
                </p>
              </div>
            )}
          </motion.div>

          {/* Add provider button */}
          <motion.div variants={fadeUp} custom={2} className="mb-6">
            <Button
              onClick={openDialog}
              variant={accounts.length > 0 ? 'outline' : 'default'}
              className="w-full gap-2 h-11"
            >
              <Plus className="h-4 w-4" />
              {accounts.length > 0 ? 'Ajouter un autre fournisseur' : 'Ajouter un fournisseur email'}
            </Button>
          </motion.div>

          {/* Info */}
          <motion.div variants={fadeUp} custom={3} className="mb-6">
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Pourquoi connecter un email ?</strong>
                <br />
                Cela vous permet d&apos;envoyer vos factures et devis directement depuis Faktur
                en un clic. Vos identifiants sont chiffrés avant stockage et ne sont jamais
                accessibles en clair.
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} custom={4} className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/onboarding/personalization')}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/onboarding/billing')}
            >
              Passer cette étape
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={() => router.push('/onboarding/billing')}
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Vous pourrez configurer votre email à tout moment dans les paramètres.
            </p>
          </motion.div>
        </CardContent>
      </Card>

      {/* ======= Add Provider Dialog ======= */}
      <Dialog open={dialogOpen} onClose={closeDialog} dismissible={dialogStep === 'choose'} className="max-w-lg">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose provider */}
          {dialogStep === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader onClose={closeDialog} icon={<Mail className="h-5 w-5 text-accent" />}>
                <DialogTitle>Choisir un fournisseur</DialogTitle>
                <DialogDescription>
                  Sélectionnez le service que vous souhaitez utiliser pour envoyer vos emails.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <button
                  onClick={() => selectProvider('gmail')}
                  disabled={connecting}
                  className="w-full flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-surface-hover hover:border-red-500/30 transition-all text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 group-hover:bg-red-500/15 transition-colors">
                    <Mail className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Gmail</p>
                    <p className="text-xs text-muted-foreground">Connexion via OAuth Google — le plus simple</p>
                  </div>
                  {connecting ? <Spinner className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />}
                </button>

                <button
                  onClick={() => selectProvider('resend')}
                  className="w-full flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-surface-hover hover:border-violet-500/30 transition-all text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/15 transition-colors">
                    <Zap className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Resend</p>
                    <p className="text-xs text-muted-foreground">API transactionnelle — domaine personnalisé</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                <button
                  onClick={() => selectProvider('smtp')}
                  className="w-full flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-surface-hover hover:border-blue-500/30 transition-all text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/15 transition-colors">
                    <Server className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">SMTP</p>
                    <p className="text-xs text-muted-foreground">Serveur personnalisé — configuration avancée</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure provider */}
          {dialogStep === 'configure' && selectedProvider === 'resend' && (
            <motion.div
              key="resend-config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setDialogStep('choose'); setConfigError('') }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Zap className="h-4 w-4 text-violet-500" />
                </div>
                <DialogTitle className="text-base">Configurer Resend</DialogTitle>
              </div>
              <DialogDescription className="mb-5 ml-10">
                Renseignez votre clé API et l&apos;email d&apos;envoi.
              </DialogDescription>

              {configError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive mb-4">
                  {configError}
                </div>
              )}

              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="dlg-resendApiKey">Clé API <span className="text-destructive">*</span></FieldLabel>
                  <div className="relative">
                    <Input
                      id="dlg-resendApiKey"
                      type={showResendKey ? 'text' : 'password'}
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, resendApiKey: true }))}
                      placeholder="re_xxxxxxxxxx..."
                      className={`pr-10 font-mono text-sm ${isFieldMissing('resendApiKey', resendApiKey) ? 'border-destructive focus:ring-destructive/20' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResendKey(!showResendKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isFieldMissing('resendApiKey', resendApiKey) && (
                    <p className="text-xs text-destructive mt-1">Ce champ est requis</p>
                  )}
                  <FieldDescription>
                    Disponible dans votre <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">tableau de bord Resend</a>
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="dlg-resendFromEmail">Email d&apos;envoi <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id="dlg-resendFromEmail"
                    type="email"
                    value={resendFromEmail}
                    onChange={(e) => setResendFromEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, resendFromEmail: true }))}
                    placeholder="facturation@votredomaine.com"
                    className={isFieldMissing('resendFromEmail', resendFromEmail) ? 'border-destructive focus:ring-destructive/20' : ''}
                  />
                  {isFieldMissing('resendFromEmail', resendFromEmail) && (
                    <p className="text-xs text-destructive mt-1">Ce champ est requis</p>
                  )}
                  <FieldDescription>Le domaine doit être vérifié dans Resend</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="dlg-resendDisplayName">
                    Nom d&apos;affichage <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </FieldLabel>
                  <Input
                    id="dlg-resendDisplayName"
                    value={resendDisplayName}
                    onChange={(e) => setResendDisplayName(e.target.value)}
                    placeholder="Mon Entreprise"
                  />
                </Field>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogStep('choose'); setConfigError('') }}>
                  Retour
                </Button>
                <Button onClick={handleConfigure} className="gap-2">
                  <Key className="h-4 w-4" />
                  Tester et connecter
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {dialogStep === 'configure' && selectedProvider === 'smtp' && (
            <motion.div
              key="smtp-config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setDialogStep('choose'); setConfigError('') }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Server className="h-4 w-4 text-blue-500" />
                </div>
                <DialogTitle className="text-base">Configurer SMTP</DialogTitle>
              </div>
              <DialogDescription className="mb-5 ml-10">
                Renseignez les paramètres de votre serveur SMTP.
              </DialogDescription>

              {configError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive mb-4">
                  {configError}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Field className="col-span-2">
                    <FieldLabel htmlFor="dlg-smtpHost">Serveur <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="dlg-smtpHost"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, smtpHost: true }))}
                      placeholder="smtp.example.com"
                      className={isFieldMissing('smtpHost', smtpHost) ? 'border-destructive focus:ring-destructive/20' : ''}
                    />
                    {isFieldMissing('smtpHost', smtpHost) && <p className="text-xs text-destructive mt-1">Requis</p>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="dlg-smtpPort">Port</FieldLabel>
                    <Input
                      id="dlg-smtpPort"
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="dlg-smtpUsername">Identifiant <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id="dlg-smtpUsername"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, smtpUsername: true }))}
                    placeholder="user@example.com"
                    className={isFieldMissing('smtpUsername', smtpUsername) ? 'border-destructive focus:ring-destructive/20' : ''}
                  />
                  {isFieldMissing('smtpUsername', smtpUsername) && <p className="text-xs text-destructive mt-1">Requis</p>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="dlg-smtpPassword">Mot de passe <span className="text-destructive">*</span></FieldLabel>
                  <div className="relative">
                    <Input
                      id="dlg-smtpPassword"
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, smtpPassword: true }))}
                      placeholder="Mot de passe ou clé d'application"
                      className={`pr-10 ${isFieldMissing('smtpPassword', smtpPassword) ? 'border-destructive focus:ring-destructive/20' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isFieldMissing('smtpPassword', smtpPassword) && <p className="text-xs text-destructive mt-1">Requis</p>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="dlg-smtpFromEmail">Email d&apos;envoi <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id="dlg-smtpFromEmail"
                    type="email"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, smtpFromEmail: true }))}
                    placeholder="facturation@votredomaine.com"
                    className={isFieldMissing('smtpFromEmail', smtpFromEmail) ? 'border-destructive focus:ring-destructive/20' : ''}
                  />
                  {isFieldMissing('smtpFromEmail', smtpFromEmail) && <p className="text-xs text-destructive mt-1">Requis</p>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="dlg-smtpDisplayName">
                    Nom d&apos;affichage <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </FieldLabel>
                  <Input
                    id="dlg-smtpDisplayName"
                    value={smtpDisplayName}
                    onChange={(e) => setSmtpDisplayName(e.target.value)}
                    placeholder="Mon Entreprise"
                  />
                </Field>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogStep('choose'); setConfigError('') }}>
                  Retour
                </Button>
                <Button onClick={handleConfigure} className="gap-2">
                  <Server className="h-4 w-4" />
                  Tester et connecter
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 3: Testing connection */}
          {dialogStep === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="mb-6"
              >
                <Spinner className="h-8 w-8 text-primary" />
              </motion.div>
              <DialogTitle className="text-center">Test de connexion en cours...</DialogTitle>
              <DialogDescription className="text-center">
                Vérification de vos identifiants avec le serveur.
              </DialogDescription>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {dialogStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            >
              <div className="flex flex-col items-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </motion.div>
                <DialogTitle className="text-center">Compte connecté avec succès</DialogTitle>
                <DialogDescription className="text-center">
                  Votre compte <span className="font-medium text-foreground">{newAccountEmail}</span> est prêt à envoyer des emails.
                </DialogDescription>
              </div>

              {/* Test email */}
              <div className="mt-4 rounded-xl border border-border bg-muted/10 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Envoyer un email de test ?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Un email de test sera envoyé à <span className="font-medium">{newAccountEmail}</span> pour vérifier que tout fonctionne.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendTestFromDialog}
                  disabled={sendingTest || testSent}
                  className="w-full gap-2"
                >
                  {sendingTest ? (
                    <><Spinner className="h-3.5 w-3.5" /> Envoi en cours...</>
                  ) : testSent ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-500" /> Email de test envoyé</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> Envoyer un email de test</>
                  )}
                </Button>
              </div>

              <DialogFooter>
                <Button onClick={closeDialog} className="w-full">
                  Terminé
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 4 alt: Error */}
          {dialogStep === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            >
              <div className="flex flex-col items-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4"
                >
                  <XCircle className="h-8 w-8 text-destructive" />
                </motion.div>
                <DialogTitle className="text-center">Échec de la connexion</DialogTitle>
                <DialogDescription className="text-center">
                  {configError || 'Impossible de se connecter. Vérifiez vos paramètres et réessayez.'}
                </DialogDescription>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogStep('configure')}>
                  Modifier les paramètres
                </Button>
                <Button onClick={closeDialog}>
                  Fermer
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </motion.div>
  )
}

export default function OnboardingEmailPage() {
  return (
    <Suspense>
      <OnboardingEmailContent />
    </Suspense>
  )
}
