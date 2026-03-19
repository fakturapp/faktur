'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  Mail, Check, Plus, ChevronLeft, Zap, Eye, EyeOff, Key, Send, Server, ArrowLeft,
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

type ProviderTab = 'choose' | 'gmail' | 'resend' | 'smtp'

export default function OnboardingEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<EmailAccountItem[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [activeTab, setActiveTab] = useState<ProviderTab>('choose')

  // Gmail
  const [connecting, setConnecting] = useState(false)

  // Resend
  const [resendApiKey, setResendApiKey] = useState('')
  const [resendFromEmail, setResendFromEmail] = useState('')
  const [resendDisplayName, setResendDisplayName] = useState('')
  const [configuringResend, setConfiguringResend] = useState(false)
  const [showResendKey, setShowResendKey] = useState(false)

  // SMTP
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFromEmail, setSmtpFromEmail] = useState('')
  const [smtpDisplayName, setSmtpDisplayName] = useState('')
  const [configuringSmtp, setConfiguringSmtp] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)

  // Test
  const [sendingTestId, setSendingTestId] = useState<string | null>(null)

  async function loadAccounts() {
    const { data } = await api.get<{ emailAccounts: EmailAccountItem[] }>('/email/accounts')
    if (data?.emailAccounts) {
      setAccounts(data.emailAccounts)
    }
    setLoadingAccounts(false)
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast('Compte Gmail connecté avec succès', 'success')
      loadAccounts()
      setActiveTab('choose')
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

  async function handleConfigureResend() {
    if (!resendApiKey.trim() || !resendFromEmail.trim()) {
      toast('Veuillez remplir la clé API et l\'email d\'envoi', 'error')
      return
    }
    setConfiguringResend(true)
    const { data, error } = await api.post<{ message: string }>('/email/resend/configure', {
      apiKey: resendApiKey.trim(),
      fromEmail: resendFromEmail.trim(),
      displayName: resendDisplayName.trim() || undefined,
    })
    setConfiguringResend(false)
    if (error) { toast(error, 'error'); return }
    toast(data?.message || 'Compte Resend configuré', 'success')
    setResendApiKey('')
    setResendFromEmail('')
    setResendDisplayName('')
    setShowResendKey(false)
    loadAccounts()
    setActiveTab('choose')
  }

  async function handleConfigureSmtp() {
    if (!smtpHost.trim() || !smtpUsername.trim() || !smtpPassword.trim() || !smtpFromEmail.trim()) {
      toast('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }
    setConfiguringSmtp(true)
    const { data, error } = await api.post<{ message: string }>('/email/smtp/configure', {
      host: smtpHost.trim(),
      port: Number(smtpPort) || 587,
      username: smtpUsername.trim(),
      password: smtpPassword.trim(),
      fromEmail: smtpFromEmail.trim(),
      displayName: smtpDisplayName.trim() || undefined,
    })
    setConfiguringSmtp(false)
    if (error) { toast(error, 'error'); return }
    toast(data?.message || 'Compte SMTP configuré', 'success')
    setSmtpHost('')
    setSmtpPort('587')
    setSmtpUsername('')
    setSmtpPassword('')
    setSmtpFromEmail('')
    setSmtpDisplayName('')
    setShowSmtpPassword(false)
    loadAccounts()
    setActiveTab('choose')
  }

  async function handleSendTest(accountId: string, email: string) {
    setSendingTestId(accountId)
    const { error } = await api.post('/email/test', { emailAccountId: accountId })
    setSendingTestId(null)
    if (error) { toast(error, 'error'); return }
    toast(`Email de test envoyé à ${email}`, 'success')
  }

  const providerLabel: Record<string, string> = { gmail: 'Gmail', resend: 'Resend', smtp: 'SMTP' }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
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
          {accounts.length > 0 && (
            <motion.div variants={fadeUp} custom={1} className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Comptes configurés
              </p>
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{acc.email}</p>
                        <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase">
                          {providerLabel[acc.provider] || acc.provider}
                        </span>
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
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Provider chooser / forms */}
          <motion.div variants={fadeUp} custom={2} className="mb-6">
            <AnimatePresence mode="wait">
              {activeTab === 'choose' ? (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {accounts.length > 0 ? 'Ajouter un autre compte' : 'Choisissez un fournisseur'}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab('gmail')}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-red-500/30 p-5 transition-all group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <Mail className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Gmail</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">OAuth Google</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('resend')}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-violet-500/30 p-5 transition-all group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                        <Zap className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Resend</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">API transactionnelle</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('smtp')}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-blue-500/30 p-5 transition-all group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <Server className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">SMTP</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Serveur personnalisé</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              ) : activeTab === 'gmail' ? (
                <motion.div
                  key="gmail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setActiveTab('choose')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                        <Mail className="h-4 w-4 text-red-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">Gmail</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Connectez votre compte Google via OAuth. Vos identifiants ne sont jamais stockés.
                    </p>
                    <Button
                      onClick={handleConnectGmail}
                      disabled={connecting}
                      className="w-full gap-2"
                    >
                      {connecting ? <Spinner className="h-3.5 w-3.5" /> : <Mail className="h-4 w-4" />}
                      Connecter Gmail
                    </Button>
                  </div>
                </motion.div>
              ) : activeTab === 'resend' ? (
                <motion.div
                  key="resend"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setActiveTab('choose')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                        <Zap className="h-4 w-4 text-violet-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">Resend</h2>
                    </div>
                    <div className="space-y-3">
                      <Field>
                        <FieldLabel htmlFor="onb-resendApiKey" className="text-xs">Clé API</FieldLabel>
                        <div className="relative">
                          <Input
                            id="onb-resendApiKey"
                            type={showResendKey ? 'text' : 'password'}
                            value={resendApiKey}
                            onChange={(e) => setResendApiKey(e.target.value)}
                            placeholder="re_xxxxxxxxxx..."
                            className="pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResendKey(!showResendKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showResendKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <FieldDescription className="text-[11px]">
                          Disponible dans votre <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">tableau de bord Resend</a>
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="onb-resendFromEmail" className="text-xs">Email d&apos;envoi</FieldLabel>
                        <Input
                          id="onb-resendFromEmail"
                          type="email"
                          value={resendFromEmail}
                          onChange={(e) => setResendFromEmail(e.target.value)}
                          placeholder="facturation@votredomaine.com"
                          className="text-xs"
                        />
                        <FieldDescription className="text-[11px]">Le domaine doit être vérifié dans Resend</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="onb-resendDisplayName" className="text-xs">
                          Nom d&apos;affichage <span className="text-muted-foreground font-normal">(optionnel)</span>
                        </FieldLabel>
                        <Input
                          id="onb-resendDisplayName"
                          value={resendDisplayName}
                          onChange={(e) => setResendDisplayName(e.target.value)}
                          placeholder="Mon Entreprise"
                          className="text-xs"
                        />
                      </Field>
                      <Button
                        size="sm"
                        onClick={handleConfigureResend}
                        disabled={configuringResend || !resendApiKey.trim() || !resendFromEmail.trim()}
                        className="w-full gap-2"
                      >
                        {configuringResend ? <Spinner className="h-3.5 w-3.5" /> : <Key className="h-3.5 w-3.5" />}
                        Configurer Resend
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="smtp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setActiveTab('choose')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <Server className="h-4 w-4 text-blue-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">SMTP</h2>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="onb-smtpHost" className="text-xs">Serveur SMTP</FieldLabel>
                          <Input
                            id="onb-smtpHost"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="smtp.example.com"
                            className="text-xs"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="onb-smtpPort" className="text-xs">Port</FieldLabel>
                          <Input
                            id="onb-smtpPort"
                            type="number"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            placeholder="587"
                            className="text-xs"
                          />
                          <FieldDescription className="text-[11px]">587 (TLS) ou 465 (SSL)</FieldDescription>
                        </Field>
                      </div>
                      <Field>
                        <FieldLabel htmlFor="onb-smtpUsername" className="text-xs">Identifiant</FieldLabel>
                        <Input
                          id="onb-smtpUsername"
                          value={smtpUsername}
                          onChange={(e) => setSmtpUsername(e.target.value)}
                          placeholder="user@example.com"
                          className="text-xs"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="onb-smtpPassword" className="text-xs">Mot de passe</FieldLabel>
                        <div className="relative">
                          <Input
                            id="onb-smtpPassword"
                            type={showSmtpPassword ? 'text' : 'password'}
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            placeholder="Mot de passe ou clé d'application"
                            className="pr-10 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSmtpPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="onb-smtpFromEmail" className="text-xs">Email d&apos;envoi</FieldLabel>
                        <Input
                          id="onb-smtpFromEmail"
                          type="email"
                          value={smtpFromEmail}
                          onChange={(e) => setSmtpFromEmail(e.target.value)}
                          placeholder="facturation@votredomaine.com"
                          className="text-xs"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="onb-smtpDisplayName" className="text-xs">
                          Nom d&apos;affichage <span className="text-muted-foreground font-normal">(optionnel)</span>
                        </FieldLabel>
                        <Input
                          id="onb-smtpDisplayName"
                          value={smtpDisplayName}
                          onChange={(e) => setSmtpDisplayName(e.target.value)}
                          placeholder="Mon Entreprise"
                          className="text-xs"
                        />
                      </Field>
                      <Button
                        size="sm"
                        onClick={handleConfigureSmtp}
                        disabled={configuringSmtp || !smtpHost.trim() || !smtpUsername.trim() || !smtpPassword.trim() || !smtpFromEmail.trim()}
                        className="w-full gap-2"
                      >
                        {configuringSmtp ? <Spinner className="h-3.5 w-3.5" /> : <Server className="h-3.5 w-3.5" />}
                        Configurer SMTP
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              className="flex-1"
              onClick={() => router.push('/onboarding/billing')}
            >
              Suivant
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Vous pourrez configurer votre email à tout moment dans les paramètres.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
