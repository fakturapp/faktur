'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FakturAiIcon } from '@/components/icons/faktur-ai-icon'
import {
  Check,
  ArrowUpRight,
  Sparkles,
  Zap,
  BarChart3,
  MessageSquare,
  FileCheck,
  Bell,
  ArrowLeft,
} from 'lucide-react'

const FREE_FEATURES = [
  { text: '5 requetes par heure', included: true },
  { text: '20 requetes par semaine', included: true },
  { text: 'Edition assistee des documents', included: true },
  { text: 'Analyse de conformite legale', included: true },
  { text: 'Mode libre creatif', included: true },
  { text: 'Multi-fournisseur IA', included: true },
]

const PRO_FEATURES = [
  { text: '30 requetes par heure', included: true, highlight: true },
  { text: '100 requetes par semaine', included: true, highlight: true },
  { text: 'Edition assistee des documents', included: true },
  { text: 'Analyse de conformite legale', included: true },
  { text: 'Mode libre creatif', included: true },
  { text: 'Multi-fournisseur IA', included: true },
  { text: 'Resume financier IA', included: true },
  { text: 'Relances de paiement IA', included: true },
]

const AI_CAPABILITIES = [
  { icon: Sparkles, title: 'Generation de texte', desc: 'Sujets, corps d\'emails, notes de factures' },
  { icon: Zap, title: 'Suggestions de lignes', desc: 'Lignes de factures basees sur l\'historique client' },
  { icon: BarChart3, title: 'Resume financier', desc: 'Analyse intelligente de votre tableau de bord' },
  { icon: MessageSquare, title: 'Chat document', desc: 'Modifiez vos factures et devis par conversation' },
  { icon: FileCheck, title: 'Generation complete', desc: 'Creez des documents entiers a partir d\'un prompt' },
  { icon: Bell, title: 'Relances IA', desc: 'Emails de relance adaptes au contexte' },
]

export default function UpgradePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const plan = user?.plan
  const isAiPro = plan?.name === 'ai_pro'

  async function handleUpgrade() {
    setLoading(true)
    const { data, error } = await api.post<{ url: string }>('/billing/checkout', {})
    setLoading(false)
    if (data?.url) {
      window.location.href = data.url
    }
    if (error) {
      console.error('Checkout error:', error)
    }
  }

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6 max-w-5xl mx-auto space-y-10">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au dashboard
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <FakturAiIcon className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Passez a <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Faktur AI Pro</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Debloquez des limites etendues et toutes les fonctionnalites IA pour optimiser votre facturation.
        </p>
      </motion.div>

      {/* Plan comparison */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Free plan */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Free</h2>
            <p className="text-sm text-muted-foreground">Pour decouvrir Faktur AI</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">0 EUR</span>
            <span className="text-sm text-muted-foreground">/ mois</span>
          </div>
          <div className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-2.5 text-sm">
                <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </div>
          {!isAiPro && (
            <div className="pt-2">
              <Button variant="outline" className="w-full" disabled>
                Plan actuel
              </Button>
            </div>
          )}
        </div>

        {/* Pro plan */}
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-bl-xl">
            Recommande
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Pro</h2>
            <p className="text-sm text-muted-foreground">Pour les professionnels</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">4,99 EUR</span>
            <span className="text-sm text-muted-foreground">/ mois</span>
          </div>
          <div className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-2.5 text-sm">
                <Check className={`h-4 w-4 shrink-0 ${f.highlight ? 'text-primary' : 'text-emerald-500'}`} />
                <span className={f.highlight ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2">
            {isAiPro ? (
              <Button variant="outline" className="w-full" disabled>
                Plan actuel
              </Button>
            ) : (
              <Button onClick={handleUpgrade} disabled={loading} className="w-full">
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Passer a AI Pro
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Capabilities grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-semibold text-foreground text-center">
          Tout ce que Faktur AI peut faire
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="rounded-xl border border-border bg-card p-5 space-y-2 hover:border-primary/20 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <cap.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{cap.title}</p>
              <p className="text-xs text-muted-foreground">{cap.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
