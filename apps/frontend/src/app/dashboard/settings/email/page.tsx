'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useEmail, type EmailAccountItem } from '@/lib/email-context'
import { api } from '@/lib/api'
import { Mail, Trash2, Star, Plus, ExternalLink, Server, Zap } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function EmailSettingsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { accounts, loading, refreshAccounts } = useEmail()
  const [connectingGmail, setConnectingGmail] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast('Compte Gmail connecté avec succès', 'success')
      refreshAccounts()
      // Clean URL
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

  async function handleConnectGmail() {
    setConnectingGmail(true)
    const { data, error } = await api.get<{ url: string }>('/email/oauth/gmail/url?returnTo=/dashboard/settings/email')
    setConnectingGmail(false)
    if (error || !data?.url) {
      toast(error || 'Erreur', 'error')
      return
    }
    window.location.href = data.url
  }

  async function handleDelete(account: EmailAccountItem) {
    setDeletingId(account.id)
    const { error } = await api.delete(`/email/accounts/${account.id}`)
    setDeletingId(null)
    if (error) { toast(error, 'error'); return }
    toast('Compte déconnecté', 'success')
    refreshAccounts()
  }

  async function handleSetDefault(account: EmailAccountItem) {
    setSettingDefaultId(account.id)
    const { error } = await api.patch(`/email/accounts/${account.id}/default`, {})
    setSettingDefaultId(null)
    if (error) { toast(error, 'error'); return }
    refreshAccounts()
  }

  const gmailAccounts = accounts.filter((a) => a.provider === 'gmail')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial="hidden" animate="visible">
        <motion.div variants={fadeUp} custom={0} className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez vos comptes email pour envoyer vos factures et devis directement depuis l&apos;application.
          </p>
        </motion.div>

        {/* Gmail */}
        <motion.div variants={fadeUp} custom={1}>
          <Card className="overflow-hidden border-border/50 mb-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <Mail className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Gmail</h2>
                    <p className="text-xs text-muted-foreground">Envoyez vos emails via votre compte Google</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectGmail}
                  disabled={connectingGmail}
                  className="gap-2"
                >
                  {connectingGmail ? <Spinner className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {gmailAccounts.length > 0 ? 'Ajouter un compte' : 'Connecter Gmail'}
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : gmailAccounts.length > 0 ? (
                <div className="space-y-2">
                  {gmailAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 text-xs font-bold shrink-0">
                          {account.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{account.email}</p>
                            {account.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                <Star className="h-2.5 w-2.5" /> Par défaut
                              </span>
                            )}
                          </div>
                          {account.displayName && (
                            <p className="text-xs text-muted-foreground truncate">{account.displayName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!account.isDefault && (
                          <button
                            onClick={() => handleSetDefault(account)}
                            disabled={settingDefaultId === account.id}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Définir par défaut"
                          >
                            {settingDefaultId === account.id ? (
                              <Spinner className="h-3.5 w-3.5" />
                            ) : (
                              <Star className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(account)}
                          disabled={deletingId === account.id}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Déconnecter"
                        >
                          {deletingId === account.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                  <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun compte Gmail connecté
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Connectez votre compte Google pour envoyer des emails
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Resend (coming soon) */}
        <motion.div variants={fadeUp} custom={2}>
          <Card className="overflow-hidden border-border/50 mb-4 opacity-60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                    <Zap className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground">Resend</h2>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Bientôt
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">API transactionnelle pour des envois fiables</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Configurer
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SMTP (coming soon) */}
        <motion.div variants={fadeUp} custom={3}>
          <Card className="overflow-hidden border-border/50 opacity-60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Server className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground">SMTP</h2>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Bientôt
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Connectez votre propre serveur SMTP</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Configurer
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
