'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useEmail, type EmailAccountItem } from '@/lib/email-context'
import { api } from '@/lib/api'
import { Textarea } from '@/components/ui/textarea'
import {
  Mail, Plus, Server, Zap, Send, Eye, EyeOff, Key, Star, Trash2,
  ArrowLeft, ArrowRight, X, CheckCircle2, XCircle, Check, MoreHorizontal,
  FileText, Receipt, FileMinus2,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

type ProviderType = 'gmail' | 'resend' | 'smtp'
type DialogStep = 'choose' | 'configure' | 'testing' | 'success' | 'error'

const providerMeta: Record<string, { label: string; color: string; bgColor: string; icon: typeof Mail }> = {
  gmail: { label: 'Gmail', color: 'text-red-500', bgColor: 'bg-red-500/10', icon: Mail },
  resend: { label: 'Resend', color: 'text-violet-500', bgColor: 'bg-violet-500/10', icon: Zap },
  smtp: { label: 'SMTP', color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Server },
}

function EmailSettingsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { accounts, loading, refreshAccounts } = useEmail()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [sendingTestId, setSendingTestId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<EmailAccountItem | null>(null)

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

  const [newAccountId, setNewAccountId] = useState<string | null>(null)
  const [newAccountEmail, setNewAccountEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testSent, setTestSent] = useState(false)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  type TemplateType = 'invoice_send' | 'quote_send' | 'credit_note_send'
  const [templates, setTemplates] = useState<Record<TemplateType, { subject: string; body: string }>>({
    invoice_send: { subject: '', body: '' },
    quote_send: { subject: '', body: '' },
    credit_note_send: { subject: '', body: '' },
  })
  const [templatesLoaded, setTemplatesLoaded] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState<TemplateType | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateType | null>(null)

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast('Compte Gmail connecté avec succès', 'success')
      refreshAccounts()
      window.history.replaceState({}, '', '/dashboard/settings/email')
    }
    if (searchParams.get('error')) {
      const errorMap: Record<string, string> = {
        oauth_cancelled: 'Connexion annulée',
        invalid_state: 'Erreur de sécurité. Veuillez réessayer.',
        oauth_failed: 'Erreur lors de la connexion à Gmail',
      }
      toast(errorMap[searchParams.get('error')!] || 'Une erreur est survenue', 'error')
      window.history.replaceState({}, '', '/dashboard/settings/email')
    }
  }, [searchParams, toast, refreshAccounts])

  useEffect(() => {
    if (!openMenuId) return
    function handleClick() { setOpenMenuId(null) }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [openMenuId])

  useEffect(() => {
    async function loadTemplates() {
      const { data } = await api.get<{ templates: Record<TemplateType, { subject: string; body: string }> }>('/email/templates')
      if (data?.templates) {
        setTemplates(data.templates)
        setTemplatesLoaded(true)
      }
    }
    loadTemplates()
  }, [])

  async function handleSaveTemplate(type: TemplateType) {
    setSavingTemplate(type)
    const tpl = templates[type]
    const { error } = await api.put('/email/templates', {
      templateType: type,
      subject: tpl.subject,
      body: tpl.body,
    })
    setSavingTemplate(null)
    if (error) { toast(error, 'error'); return }
    toast('Template enregistré', 'success')
    setEditingTemplate(null)
  }

  function updateTemplate(type: TemplateType, field: 'subject' | 'body', value: string) {
    setTemplates((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }))
  }

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
    const { data, error } = await api.get<{ url: string }>('/email/oauth/gmail/url?returnTo=/dashboard/settings/email')
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
      const { data, error } = await api.post<{ message: string; emailAccount?: { id: string; email: string } }>('/email/resend/configure', {
        apiKey: resendApiKey.trim(),
        fromEmail: resendFromEmail.trim(),
        displayName: resendDisplayName.trim() || undefined,
      })
      if (error) {
        setConfigError(error)
        setDialogStep('error')
        return
      }
      setNewAccountId(data?.emailAccount?.id || null)
      setNewAccountEmail(data?.emailAccount?.email || resendFromEmail)
      setDialogStep('success')
      refreshAccounts()
    }

    if (selectedProvider === 'smtp') {
      const t: Record<string, boolean> = { smtpHost: true, smtpUsername: true, smtpPassword: true, smtpFromEmail: true }
      setTouched(t)
      if (!smtpHost.trim() || !smtpUsername.trim() || !smtpPassword.trim() || !smtpFromEmail.trim()) {
        setConfigError('Veuillez remplir tous les champs obligatoires')
        return
      }
      setDialogStep('testing')
      const { data, error } = await api.post<{ message: string; emailAccount?: { id: string; email: string } }>('/email/smtp/configure', {
        host: smtpHost.trim(),
        port: Number(smtpPort) || 587,
        username: smtpUsername.trim(),
        password: smtpPassword.trim(),
        fromEmail: smtpFromEmail.trim(),
        displayName: smtpDisplayName.trim() || undefined,
      })
      if (error) {
        setConfigError(error)
        setDialogStep('error')
        return
      }
      setNewAccountId(data?.emailAccount?.id || null)
      setNewAccountEmail(data?.emailAccount?.email || smtpFromEmail)
      setDialogStep('success')
      refreshAccounts()
    }
  }

  async function handleSendTestFromDialog() {
    if (!newAccountId) return
    setSendingTest(true)
    const { error } = await api.post('/email/test', { emailAccountId: newAccountId })
    setSendingTest(false)
    if (error) { toast(error, 'error'); return }
    setTestSent(true)
    toast(`Email de test envoyé à ${newAccountEmail}`, 'success')
  }

  async function handleSendTest(account: EmailAccountItem) {
    setSendingTestId(account.id)
    const { error } = await api.post('/email/test', { emailAccountId: account.id })
    setSendingTestId(null)
    if (error) { toast(error, 'error'); return }
    toast(`Email de test envoyé à ${account.email}`, 'success')
  }

  async function handleDelete(account: EmailAccountItem) {
    setDeletingId(account.id)
    const { error } = await api.delete(`/email/accounts/${account.id}`)
    setDeletingId(null)
    setDeleteConfirm(null)
    if (error) { toast(error, 'error'); return }
    toast('Compte déconnecté', 'success')
    refreshAccounts()
  }

  async function handleSetDefault(account: EmailAccountItem) {
    setSettingDefaultId(account.id)
    const { error } = await api.patch(`/email/accounts/${account.id}/default`, {})
    setSettingDefaultId(null)
    if (error) { toast(error, 'error'); return }
    toast(`${account.email} est maintenant le compte par défaut`, 'success')
    refreshAccounts()
  }

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6 max-w-3xl mx-auto">
      <motion.div initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez vos comptes email pour envoyer factures et devis.
            </p>
          </div>
          <Button onClick={openDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </motion.div>

        {/* Accounts list */}
        <motion.div variants={fadeUp} custom={1}>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Comptes connectés
                </p>
                <p className="text-xs text-muted-foreground">
                  {accounts.length} compte{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                      <div className="h-9 w-9 rounded-lg bg-muted animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : accounts.length > 0 ? (
                <div className="space-y-2">
                  {accounts.map((acc, i) => {
                    const meta = providerMeta[acc.provider] || providerMeta.smtp
                    const Icon = meta.icon
                    return (
                      <motion.div
                        key={acc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group flex items-center gap-3 rounded-xl border border-border hover:border-border/80 px-4 py-3 transition-colors"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bgColor}`}>
                          <Icon className={`h-4 w-4 ${meta.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{acc.email}</p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${meta.bgColor} ${meta.color}`}>
                              {meta.label}
                            </span>
                            {acc.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                                <Star className="h-2.5 w-2.5" /> Par défaut
                              </span>
                            )}
                          </div>
                          {acc.displayName && (
                            <p className="text-xs text-muted-foreground truncate">{acc.displayName}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleSendTest(acc)}
                            disabled={sendingTestId === acc.id}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent-soft transition-colors"
                            title="Envoyer un email de test"
                          >
                            {sendingTestId === acc.id ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                          </button>
                          {!acc.isDefault && (
                            <button
                              onClick={() => handleSetDefault(acc)}
                              disabled={settingDefaultId === acc.id}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                              title="Définir par défaut"
                            >
                              {settingDefaultId === acc.id ? <Spinner className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm(acc)}
                            disabled={deletingId === acc.id}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Supprimer"
                          >
                            {deletingId === acc.id ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-10 text-center">
                  <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Aucun compte email</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Ajoutez un fournisseur pour commencer à envoyer des emails depuis Faktur.
                  </p>
                  <Button onClick={openDialog} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un fournisseur
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info card */}
        <motion.div variants={fadeUp} custom={2} className="mt-4">
          <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Sécurité</strong> — Vos identifiants sont chiffrés avant stockage et ne sont jamais accessibles en clair.
              Les connexions Gmail utilisent OAuth 2.0, aucun mot de passe n&apos;est stocké.
            </p>
          </div>
        </motion.div>

        {/* Email Templates */}
        <motion.div variants={fadeUp} custom={3} className="mt-6">
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-6">
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Templates d&apos;email
                </p>
                <p className="text-xs text-muted-foreground">
                  Personnalisez les messages par défaut. Variables : <code className="text-accent">{'{type}'}</code> <code className="text-accent">{'{numero}'}</code> <code className="text-accent">{'{montant}'}</code> <code className="text-accent">{'{client_name}'}</code>
                </p>
              </div>

              {templatesLoaded ? (
                <div className="space-y-3">
                  {([
                    { type: 'invoice_send' as TemplateType, label: 'Facture', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                    { type: 'quote_send' as TemplateType, label: 'Devis', icon: Receipt, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
                    { type: 'credit_note_send' as TemplateType, label: 'Avoir', icon: FileMinus2, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
                  ]).map((item) => (
                    <div key={item.type} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bgColor}`}>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <p className="text-sm font-semibold text-foreground">Envoi {item.label}</p>
                        </div>
                        {editingTemplate === item.type ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTemplate(null)}
                            >
                              Annuler
                            </Button>
                            <Button
                              size="sm"
                              disabled={savingTemplate === item.type}
                              onClick={() => handleSaveTemplate(item.type)}
                            >
                              {savingTemplate === item.type ? <Spinner className="h-3.5 w-3.5" /> : 'Enregistrer'}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(item.type)}
                          >
                            Modifier
                          </Button>
                        )}
                      </div>

                      {editingTemplate === item.type ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Objet</label>
                            <Input
                              value={templates[item.type].subject}
                              onChange={(e) => updateTemplate(item.type, 'subject', e.target.value)}
                              placeholder="Objet de l'email"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Message</label>
                            <Textarea
                              value={templates[item.type].body}
                              onChange={(e) => updateTemplate(item.type, 'body', e.target.value)}
                              rows={5}
                              placeholder="Corps de l'email"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Objet :</span> {templates[item.type].subject}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            <span className="font-medium text-foreground">Message :</span> {templates[item.type].body}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-border p-4">
                      <div className="h-4 w-32 rounded bg-muted animate-pulse mb-2" />
                      <div className="h-3 w-full rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

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
              <DialogHeader onClose={closeDialog}>
                <DialogTitle>Ajouter un fournisseur</DialogTitle>
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

          {/* Step 2: Configure Resend */}
          {dialogStep === 'configure' && selectedProvider === 'resend' && (
            <motion.div
              key="resend-config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => { setDialogStep('choose'); setConfigError('') }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <DialogHeader className="mb-0 flex-1" icon={<Zap className="h-4 w-4 text-violet-500" />}>
                  <DialogTitle className="text-base">Configurer Resend</DialogTitle>
                  <DialogDescription>
                    Renseignez votre clé API et l&apos;email d&apos;envoi.
                  </DialogDescription>
                </DialogHeader>
              </div>

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

          {/* Step 2: Configure SMTP */}
          {dialogStep === 'configure' && selectedProvider === 'smtp' && (
            <motion.div
              key="smtp-config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => { setDialogStep('choose'); setConfigError('') }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <DialogHeader className="mb-0 flex-1" icon={<Server className="h-4 w-4 text-blue-500" />}>
                  <DialogTitle className="text-base">Configurer SMTP</DialogTitle>
                  <DialogDescription>
                    Renseignez les paramètres de votre serveur SMTP.
                  </DialogDescription>
                </DialogHeader>
              </div>

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
                <Spinner className="h-8 w-8 text-accent" />
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} className="max-w-sm">
        <DialogHeader showClose={false} icon={<Trash2 className="h-5 w-5 text-danger" />}>
          <DialogTitle>Déconnecter le compte</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir déconnecter <strong className="text-foreground">{deleteConfirm?.email}</strong> ? Vous ne pourrez plus envoyer d&apos;emails via ce compte.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button
            variant="destructive"
            disabled={deletingId !== null}
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="gap-2"
          >
            {deletingId ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
            Déconnecter
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default function EmailSettingsPage() {
  return (
    <Suspense>
      <EmailSettingsContent />
    </Suspense>
  )
}
