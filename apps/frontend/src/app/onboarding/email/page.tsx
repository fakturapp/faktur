'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Mail, Check, Plus } from 'lucide-react'

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

export default function OnboardingEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [connecting, setConnecting] = useState(false)
  const [accounts, setAccounts] = useState<EmailAccountItem[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

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

  function handleSkip() {
    router.push('/onboarding/billing')
  }

  function handleNext() {
    router.push('/onboarding/billing')
  }

  const hasConnectedAccount = accounts.length > 0

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
                Connectez votre compte Gmail pour envoyer vos factures et devis directement depuis l&apos;application.
              </p>
            </div>
          </motion.div>

          {/* Gmail card */}
          <motion.div variants={fadeUp} custom={1} className="mb-6">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <Mail className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Gmail</h2>
                  <p className="text-xs text-muted-foreground">Envoyez via votre compte Google</p>
                </div>
              </div>

              {loadingAccounts ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner />
                </div>
              ) : hasConnectedAccount ? (
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                        <Check className="h-4 w-4 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{acc.email}</p>
                        {acc.displayName && (
                          <p className="text-xs text-muted-foreground truncate">{acc.displayName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectGmail}
                    disabled={connecting}
                    className="w-full mt-2 gap-2"
                  >
                    {connecting ? <Spinner className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    Ajouter un autre compte
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleConnectGmail}
                  disabled={connecting}
                  className="w-full gap-2"
                >
                  {connecting ? <Spinner className="h-3.5 w-3.5" /> : <Mail className="h-4 w-4" />}
                  Connecter Gmail
                </Button>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} custom={2} className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
            >
              Passer cette étape
            </Button>
            <Button
              className="flex-1"
              onClick={handleNext}
            >
              Suivant
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Vous pourrez configurer votre email à tout moment dans les paramètres.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
