'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { AlertTriangle, CheckCircle, Eye, EyeOff, Copy, Check } from 'lucide-react'

interface StripeActivationModalProps {
  open: boolean
  onClose: () => void
  onActivated: () => void
  webhookUrl: string
}

export function StripeActivationModal({ open, onClose, onActivated, webhookUrl }: StripeActivationModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhook, setShowWebhook] = useState(false)

  const pkValid = publishableKey.startsWith('pk_live_') || publishableKey.startsWith('pk_test_')
  const skValid = secretKey.startsWith('sk_live_') || secretKey.startsWith('sk_test_')
  const whValid = webhookSecret.startsWith('whsec_')
  const allValid = pkValid && skValid && whValid

  async function handleActivate() {
    setLoading(true)
    setError('')

    const { error: err } = await api.put('/settings/stripe', {
      publishableKey,
      secretKey,
      webhookSecret,
    })

    setLoading(false)

    if (err) {
      setError(err)
      return
    }

    toast('Stripe activé avec succès', 'success')
    onActivated()
    onClose()
  }

  function handleCopyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogTitle>Configurer Stripe</DialogTitle>
      <DialogDescription>
        Entrez vos clés Stripe pour accepter les paiements par carte bancaire.
      </DialogDescription>

      <div className="mt-5 space-y-4">
        {}
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-4">
          <p className="text-xs font-semibold text-foreground mb-2">1. Configurez le webhook dans votre Dashboard Stripe</p>
          <p className="text-xs text-muted-foreground mb-2">
            Allez dans <strong>Developers → Webhooks → Add endpoint</strong> et collez cette URL :
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] bg-muted/30 rounded-lg px-3 py-2 text-foreground font-mono truncate">
              {webhookUrl}
            </code>
            <Button size="sm" variant="outline" onClick={handleCopyWebhookUrl} className="shrink-0 h-8">
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Événements à écouter : <code className="text-foreground">payment_intent.succeeded</code>, <code className="text-foreground">payment_intent.payment_failed</code>
          </p>
        </div>

        {}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            2. Clé publique (Publishable Key)
          </label>
          <Input
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            placeholder="pk_live_... ou pk_test_..."
            className={publishableKey && !pkValid ? 'border-red-500/50' : ''}
          />
          {publishableKey && !pkValid && (
            <p className="text-xs text-red-400 mt-1">Doit commencer par pk_live_ ou pk_test_</p>
          )}
        </div>

        {}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            3. Clé secrète (Secret Key)
          </label>
          <div className="relative">
            <Input
              type={showSecret ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_... ou sk_test_..."
              className={`pr-10 ${secretKey && !skValid ? 'border-red-500/50' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {secretKey && !skValid && (
            <p className="text-xs text-red-400 mt-1">Doit commencer par sk_live_ ou sk_test_</p>
          )}
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            4. Secret du webhook (Webhook Signing Secret)
          </label>
          <div className="relative">
            <Input
              type={showWebhook ? 'text' : 'password'}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className={`pr-10 ${webhookSecret && !whValid ? 'border-red-500/50' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowWebhook(!showWebhook)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {webhookSecret && !whValid && (
            <p className="text-xs text-red-400 mt-1">Doit commencer par whsec_</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose}>
          Annuler
        </Button>
        <Button size="sm" disabled={loading || !allValid} onClick={handleActivate}>
          {loading ? <Spinner className="h-4 w-4" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
          Valider et activer
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
