'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { GroqIcon } from '@/components/icons/groq-icon'
import {
  Sparkles,
  FlaskConical,
  Check,
  Info,
  AlertTriangle,
  Zap,
  Brain,
  Crown,
  Pencil,
  HelpCircle,
  Wand2,
  Shield,
} from 'lucide-react'

/* ─── Model tiers ─────────────────────────────────────────────── */
const MODEL_TIERS = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Rapide',
    description: 'Réponses instantanées, idéal pour les tâches simples',
    icon: Zap,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    badge: 'Rapide',
    badgeColor: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Raisonnement',
    description: 'Bon équilibre entre qualité et vitesse',
    icon: Brain,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    badge: 'Recommandé',
    badgeColor: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'Pro',
    description: 'Meilleur modèle pour les tâches complexes',
    icon: Crown,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    badge: 'Pro',
    badgeColor: 'bg-amber-500/10 text-amber-500',
  },
]

/* ─── Chat modes ──────────────────────────────────────────────── */
const CHAT_MODES = [
  {
    id: 'edition' as const,
    name: 'Édition',
    description: 'Modifier le contenu du document',
    icon: Pencil,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    id: 'question' as const,
    name: 'Question',
    description: 'Poser des questions de conformité',
    icon: HelpCircle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    id: 'libre' as const,
    name: 'Libre',
    description: 'Instructions libres avec suggestions',
    icon: Wand2,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
]

/* ─── Local storage helpers for default mode ──────────────────── */

function getDefaultMode(): string {
  if (typeof window === 'undefined') return 'edition'
  try {
    const prefs = localStorage.getItem('faktur_ai_chat_pref')
    if (prefs) {
      const parsed = JSON.parse(prefs)
      if (parsed.mode) return parsed.mode
    }
  } catch {}
  return 'edition'
}

function saveDefaultMode(mode: string) {
  try {
    const raw = localStorage.getItem('faktur_ai_chat_pref')
    const prefs = raw ? JSON.parse(raw) : {}
    prefs.mode = mode
    localStorage.setItem('faktur_ai_chat_pref', JSON.stringify(prefs))
  } catch {}
}

export default function FakturAIPage() {
  const { toast } = useToast()
  const { settings, loading, updateSettings } = useInvoiceSettings()

  const [showAiBetaModal, setShowAiBetaModal] = useState(false)
  const [defaultMode, setDefaultMode] = useState(getDefaultMode)

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl border border-border/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Faktur AI</h1>
        <p className="text-sm text-muted-foreground">Assistant intelligent pour vos documents</p>
      </div>

      {/* ═══ Activation Card ═══ */}
      <Card>
        <CardContent className="p-6">
          {/* Card header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">Faktur AI</h2>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-semibold uppercase tracking-wide animate-pulse">Bêta</span>
                </div>
                <p className="text-xs text-muted-foreground">Propulsé par Groq</p>
              </div>
            </div>
          </div>

          {/* Beta info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-4">
            <FlaskConical className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-yellow-500">Fonctionnalité en bêta</p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Faktur AI est en développement actif. L&apos;assistant vous aide à modifier, analyser et optimiser vos factures et devis grâce à l&apos;intelligence artificielle.
              </p>
            </div>
          </div>

          {/* Toggle activation */}
          <div className="flex items-center justify-between rounded-xl border-2 border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.aiEnabled ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10' : 'bg-muted'}`}>
                <Sparkles className={`h-5 w-5 ${settings.aiEnabled ? 'text-indigo-400' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Activer Faktur AI</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[8px] font-semibold uppercase">Bêta</span>
                </div>
                <p className="text-xs text-muted-foreground">Active Faktur AI dans toute l&apos;application</p>
              </div>
            </div>
            <button type="button"
              onClick={() => {
                if (!settings.aiEnabled) {
                  setShowAiBetaModal(true)
                } else {
                  updateSettings({ aiEnabled: false })
                  toast('Faktur AI désactivé', 'info')
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                settings.aiEnabled ? 'bg-indigo-500' : 'bg-muted-foreground/30'
              }`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                settings.aiEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Configuration (visible when enabled) ═══ */}
      <AnimatePresence>
        {settings.aiEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden space-y-6"
          >
            {/* ─── Model Selection Card ─── */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                    <GroqIcon className="h-4.5 w-4.5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Modèle préféré</h2>
                    <p className="text-xs text-muted-foreground">Choisissez le modèle utilisé par défaut</p>
                  </div>
                </div>

                {/* Provider info */}
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <GroqIcon className="h-4 w-4 text-orange-500 shrink-0" />
                    <p className="text-[11px] text-foreground/70">
                      <span className="font-medium text-orange-500">Groq</span> — API intégrée, aucune configuration nécessaire
                    </p>
                  </div>
                </div>

                {/* Model tier cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODEL_TIERS.map((tier) => {
                    const TierIcon = tier.icon
                    const isSelected = settings.aiModel === tier.id
                    return (
                      <button key={tier.id}
                        onClick={() => {
                          updateSettings({ aiProvider: 'groq', aiModel: tier.id })
                          toast(`Modèle ${tier.name} sélectionné`, 'success')
                        }}
                        className={`rounded-xl border-2 p-4 text-left transition-all relative group ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                            : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                        }`}>
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${tier.iconBg}`}>
                          <TierIcon className={`h-4.5 w-4.5 ${tier.iconColor}`} />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{tier.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{tier.description}</p>
                        <span className={`inline-block mt-2 text-[9px] font-medium px-2 py-0.5 rounded-full ${tier.badgeColor}`}>
                          {tier.badge}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ─── Default Mode Card ─── */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                    <Wand2 className="h-4.5 w-4.5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Mode par défaut</h2>
                    <p className="text-xs text-muted-foreground">Mode utilisé à l&apos;ouverture du chat IA</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CHAT_MODES.map((mode) => {
                    const ModeIcon = mode.icon
                    const isSelected = defaultMode === mode.id
                    return (
                      <button key={mode.id}
                        onClick={() => {
                          setDefaultMode(mode.id)
                          saveDefaultMode(mode.id)
                          toast(`Mode ${mode.name} par défaut`, 'success')
                        }}
                        className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                            : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                        }`}>
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${mode.iconBg}`}>
                          <ModeIcon className={`h-4.5 w-4.5 ${mode.iconColor}`} />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{mode.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{mode.description}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ─── Features & Privacy Card ─── */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Check className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Fonctionnalités</h2>
                    <p className="text-xs text-muted-foreground">Ce que Faktur AI peut faire pour vous</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2.5 mb-4">
                  {[
                    { text: 'Édition assistée des factures et devis', available: true },
                    { text: 'Analyse de conformité légale', available: true },
                    { text: 'Mode libre créatif', available: true },
                    { text: 'Résumé financier IA sur le tableau de bord', available: false },
                    { text: 'Relances de paiement automatiques', available: false },
                  ].map((feature) => (
                    <div key={feature.text} className="flex items-center gap-2.5">
                      {feature.available ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="h-3.5 w-3.5 flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-muted-foreground">—</span>
                        </span>
                      )}
                      <span className={`text-xs ${feature.available ? 'text-foreground' : 'text-muted-foreground/50'}`}>{feature.text}</span>
                      {!feature.available && (
                        <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Bientôt</span>
                      )}
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Privacy info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                    <Shield className="h-4.5 w-4.5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Confidentialité</h2>
                    <p className="text-xs text-muted-foreground">Comment vos données sont traitées</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2">
                  {[
                    'Vos données ne sont pas utilisées pour entraîner les modèles',
                    'Les échanges ne quittent pas votre session active',
                    'Aucune clé API personnelle requise',
                    'Vous pouvez désactiver l\'IA à tout moment',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ AI Beta Activation Modal ═══ */}
      <Dialog open={showAiBetaModal} onClose={() => setShowAiBetaModal(false)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Activer Faktur AI
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-semibold uppercase tracking-wide">Bêta</span>
              </DialogTitle>
              <DialogDescription>Assistant intelligent pour vos documents</DialogDescription>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Faktur AI est actuellement en <strong>version bêta</strong>. Les réponses générées par l&apos;IA peuvent contenir des erreurs ou des inexactitudes.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              En activant Faktur AI, vous pourrez utiliser l&apos;assistant dans l&apos;éditeur de factures et devis pour modifier, analyser et optimiser vos documents.
            </p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Vérifiez toujours les suggestions de l\'IA avant de les appliquer',
                'Les données de vos documents ne quittent pas votre session',
                'Vous pouvez désactiver l\'IA à tout moment',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAiBetaModal(false)}>Annuler</Button>
            <Button onClick={() => {
              updateSettings({ aiEnabled: true, aiProvider: 'groq', aiModel: 'llama-3.3-70b-versatile' })
              setShowAiBetaModal(false)
              toast('Faktur AI activé', 'success')
            }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
              <Sparkles className="h-4 w-4 mr-2" /> Activer Faktur AI
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}
