'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { AnthropicIcon } from '@/components/icons/anthropic-icon'
import { GoogleIcon } from '@/components/icons/google-icon'
import { GroqIcon } from '@/components/icons/groq-icon'
import {
  Sparkles,
  FlaskConical,
  Shield,
  Check,
  Key,
  Eye,
  EyeOff,
  PenLine,
  Trash2,
  Info,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'

const defaultModels: Record<string, string> = {
  claude: 'claude-sonnet-4-5-20250929',
  gemini: 'gemini-2.5-flash-lite',
  groq: 'llama-3.3-70b-versatile',
}

export default function FakturAIPage() {
  const { toast } = useToast()
  const { settings, loading, updateSettings } = useInvoiceSettings()

  const [showPdpKey] = useState(false)
  const [aiKeyModalProvider, setAiKeyModalProvider] = useState<'claude' | 'gemini' | 'groq' | null>(null)
  const [aiKeyModalValue, setAiKeyModalValue] = useState('')
  const [aiKeyModalShow, setAiKeyModalShow] = useState(false)
  const [aiDeleteConfirmProvider, setAiDeleteConfirmProvider] = useState<'claude' | 'gemini' | 'groq' | null>(null)
  const [showAiBetaModal, setShowAiBetaModal] = useState(false)
  const [showAiSwitchConfirm, setShowAiSwitchConfirm] = useState<'server' | 'custom' | null>(null)

  const aiKeyMode = settings.aiKeyMode

  // Prevent unused variable warning
  void showPdpKey

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
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
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

      {/* Main Card */}
      <Card>
        <CardContent className="p-6">
          {/* Header */}
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
                <p className="text-xs text-muted-foreground">Assistant intelligent pour vos documents</p>
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
          <div className="flex items-center justify-between rounded-xl border-2 border-border p-4 mb-4">
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

          {/* Configuration (visible when enabled) */}
          <AnimatePresence>
            {settings.aiEnabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-4 pt-2">
                  <Separator />

                  {/* ── Source mode: Faktur AI vs Ma clé API ── */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Source API</label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Faktur AI card */}
                      <button
                        onClick={() => {
                          if (aiKeyMode !== 'server') setShowAiSwitchConfirm('server')
                        }}
                        className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                          aiKeyMode === 'server'
                            ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                            <Shield className="h-4 w-4 text-indigo-400" />
                          </div>
                          {aiKeyMode === 'server' && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                              <Check className="h-3 w-3 text-white" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">Faktur AI</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">API intégrée — aucune configuration</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Recommandé</span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">Bêta</span>
                        </div>
                      </button>

                      {/* Ma clé API card */}
                      <button
                        onClick={() => {
                          if (aiKeyMode !== 'custom') setShowAiSwitchConfirm('custom')
                        }}
                        className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                          aiKeyMode === 'custom'
                            ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                            <Key className="h-4 w-4 text-orange-500" />
                          </div>
                          {aiKeyMode === 'custom' && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                              <Check className="h-3 w-3 text-white" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">Ma clé API</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Vos propres clés API personnelles</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Avancé</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <Separator />

                  {/* ── Provider selector ── */}
                  <div className={aiKeyMode === 'custom' && ![settings.aiApiKeyClaude, settings.aiApiKeyGemini, settings.aiApiKeyGroq].some(Boolean) ? 'opacity-40 pointer-events-none' : ''}>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Fournisseur IA</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        {
                          id: 'gemini' as const,
                          name: 'Gemini',
                          desc: 'Google AI',
                          badge: 'Gratuit',
                          badgeColor: 'bg-emerald-500/10 text-emerald-600',
                          icon: <GoogleIcon className="h-4 w-4" />,
                          iconBg: 'bg-blue-500/10',
                          hasKey: !!settings.aiApiKeyGemini,
                        },
                        {
                          id: 'groq' as const,
                          name: 'Groq',
                          desc: 'Llama 3.3',
                          badge: 'Gratuit',
                          badgeColor: 'bg-emerald-500/10 text-emerald-600',
                          icon: <GroqIcon className="h-4 w-4 text-orange-500" />,
                          iconBg: 'bg-orange-500/10',
                          hasKey: !!settings.aiApiKeyGroq,
                        },
                        {
                          id: 'claude' as const,
                          name: 'Claude',
                          desc: 'Anthropic',
                          badge: 'Payant',
                          badgeColor: 'bg-amber-500/10 text-amber-600',
                          icon: <AnthropicIcon className="h-4 w-4 text-violet-500" />,
                          iconBg: 'bg-violet-500/10',
                          hasKey: !!settings.aiApiKeyClaude,
                        },
                      ]).map((provider) => {
                        const disabled = aiKeyMode === 'custom' && !provider.hasKey
                        return (
                          <button key={provider.id}
                            disabled={disabled}
                            onClick={() => {
                              updateSettings({ aiProvider: provider.id, aiModel: defaultModels[provider.id] })
                            }}
                            className={`rounded-xl border-2 p-3 text-left transition-all relative ${
                              settings.aiProvider === provider.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${provider.iconBg}`}>
                              {provider.icon}
                            </div>
                            <p className="text-xs font-semibold text-foreground">{provider.name}</p>
                            <p className="text-[10px] text-muted-foreground">{provider.desc}</p>
                            <span className={`absolute top-2 right-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${provider.badgeColor}`}>
                              {provider.badge}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── Model selector ── */}
                  <div className={aiKeyMode === 'custom' && ![settings.aiApiKeyClaude, settings.aiApiKeyGemini, settings.aiApiKeyGroq].some(Boolean) ? 'opacity-40 pointer-events-none' : ''}>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Modèle</label>
                    <div className="grid grid-cols-2 gap-2">
                      {settings.aiProvider === 'claude' && ([
                        { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet', desc: 'Rapide et économique' },
                        { id: 'claude-opus-4-6', name: 'Claude Opus', desc: 'Plus puissant' },
                      ].map((model) => (
                        <button key={model.id} onClick={() => updateSettings({ aiModel: model.id })}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            settings.aiModel === model.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                          }`}>
                          <p className="text-xs font-medium text-foreground">{model.name}</p>
                          <p className="text-[10px] text-muted-foreground">{model.desc}</p>
                        </button>
                      )))}
                      {settings.aiProvider === 'gemini' && ([
                        { id: 'gemini-2.5-flash-lite', name: 'Flash Lite', desc: '1 000 req/jour gratuit' },
                        { id: 'gemini-2.5-flash', name: 'Flash', desc: '250 req/jour gratuit' },
                        { id: 'gemini-2.5-pro', name: 'Pro', desc: '100 req/jour gratuit' },
                      ].map((model) => (
                        <button key={model.id} onClick={() => updateSettings({ aiModel: model.id })}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            settings.aiModel === model.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                          }`}>
                          <p className="text-xs font-medium text-foreground">{model.name}</p>
                          <p className="text-[10px] text-muted-foreground">{model.desc}</p>
                        </button>
                      )))}
                      {settings.aiProvider === 'groq' && ([
                        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', desc: 'Puissant, gratuit' },
                        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', desc: 'Ultra rapide' },
                      ].map((model) => (
                        <button key={model.id} onClick={() => updateSettings({ aiModel: model.id })}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            settings.aiModel === model.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                          }`}>
                          <p className="text-xs font-medium text-foreground">{model.name}</p>
                          <p className="text-[10px] text-muted-foreground">{model.desc}</p>
                        </button>
                      )))}
                    </div>
                  </div>

                  {/* ── Per-provider key management (inline, visible when "Ma clé API") ── */}
                  <AnimatePresence>
                    {aiKeyMode === 'custom' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Separator className="mb-4" />
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Vos clés API</label>
                        <div className="space-y-2">
                          {([
                            { id: 'claude' as const, name: 'Claude (Anthropic)', icon: <AnthropicIcon className="h-4 w-4 text-violet-500" />, iconBg: 'bg-violet-500/10', key: settings.aiApiKeyClaude },
                            { id: 'gemini' as const, name: 'Gemini (Google)', icon: <GoogleIcon className="h-4 w-4" />, iconBg: 'bg-blue-500/10', key: settings.aiApiKeyGemini },
                            { id: 'groq' as const, name: 'Groq', icon: <GroqIcon className="h-4 w-4 text-orange-500" />, iconBg: 'bg-orange-500/10', key: settings.aiApiKeyGroq },
                          ]).map((provider) => (
                            <div key={provider.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${provider.iconBg}`}>
                                {provider.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{provider.name}</p>
                                {provider.key ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <p className="text-[11px] text-emerald-500 font-medium">Configurée</p>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground/60 italic">Non configurée</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => { setAiKeyModalValue(''); setAiKeyModalShow(false); setAiKeyModalProvider(provider.id) }}
                                >
                                  <PenLine className="h-3 w-3 mr-1" />
                                  {provider.key ? 'Modifier' : 'Ajouter'}
                                </Button>
                                {provider.key && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    onClick={() => setAiDeleteConfirmProvider(provider.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-border p-3 mt-3">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Vos clés sont chiffrées de bout en bout via notre système Zero-Access. Elles ne sont jamais stockées en clair.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Faktur AI info (visible when server mode) ── */}
                  <AnimatePresence>
                    {aiKeyMode === 'server' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                          <div className="flex items-start gap-3">
                            <Shield className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-indigo-400">Mode Faktur AI actif</p>
                              <p className="text-[11px] text-foreground/70 leading-relaxed">
                                Vous utilisez l&apos;API intégrée de Faktur. Aucune clé API n&apos;est nécessaire. Les requêtes sont traitées par nos serveurs.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Separator />

                  {/* Features list */}
                  <div className="rounded-xl border border-border p-4 space-y-2.5">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-semibold text-foreground">Fonctionnalités incluses</p>
                      <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[8px] font-semibold uppercase">Bêta</span>
                    </div>
                    {[
                      { text: 'Édition assistée des factures et devis', available: true },
                      { text: 'Analyse de conformité légale', available: true },
                      { text: 'Mode libre créatif', available: true },
                      { text: 'Multi-fournisseur (Gemini, Groq, Claude)', available: true },
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
                        <span className={`text-[11px] ${feature.available ? 'text-foreground' : 'text-muted-foreground/50'}`}>{feature.text}</span>
                        {!feature.available && (
                          <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Bientôt</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

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
            <Button onClick={() => { updateSettings({ aiEnabled: true }); setShowAiBetaModal(false); toast('Faktur AI activé', 'success') }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
              <Sparkles className="h-4 w-4 mr-2" /> Activer Faktur AI
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* ═══ AI Source Switch Confirmation Modal ═══ */}
      <Dialog open={showAiSwitchConfirm !== null} onClose={() => setShowAiSwitchConfirm(null)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              showAiSwitchConfirm === 'server' ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' : 'bg-orange-500/10'
            }`}>
              {showAiSwitchConfirm === 'server' ? <Shield className="h-6 w-6 text-indigo-400" /> : <Key className="h-6 w-6 text-orange-500" />}
            </div>
            <div>
              <DialogTitle>
                {showAiSwitchConfirm === 'server' ? 'Passer à Faktur AI' : 'Passer à Ma clé API'}
              </DialogTitle>
              <DialogDescription>Changement de source API</DialogDescription>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            {showAiSwitchConfirm === 'server' ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  En passant à <strong className="text-foreground">Faktur AI</strong>, vos requêtes utiliseront exclusivement l&apos;API intégrée de Faktur. Vos clés API personnelles ne seront plus utilisées.
                </p>
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs text-foreground">Aucune configuration nécessaire</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs text-foreground">Vos clés existantes sont conservées</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  En passant à <strong className="text-foreground">Ma clé API</strong>, vous devrez configurer vos propres clés API. L&apos;API Faktur ne sera plus utilisée.
                </p>
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs text-foreground">Vous devez avoir au moins une clé API configurée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs text-foreground">Les clés sont chiffrées de bout en bout</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAiSwitchConfirm(null)}>Annuler</Button>
            <Button onClick={() => {
              if (showAiSwitchConfirm) {
                updateSettings({ aiKeyMode: showAiSwitchConfirm })
                toast(showAiSwitchConfirm === 'server' ? 'Mode Faktur AI activé' : 'Mode clé personnelle activé', 'success')
              }
              setShowAiSwitchConfirm(null)
            }}>
              {showAiSwitchConfirm === 'server' ? <Shield className="h-4 w-4 mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Confirmer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* AI API Key Configuration Modal */}
      <Dialog open={aiKeyModalProvider !== null} onClose={() => setAiKeyModalProvider(null)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              aiKeyModalProvider === 'claude' ? 'bg-violet-500/10' : aiKeyModalProvider === 'gemini' ? 'bg-blue-500/10' : 'bg-orange-500/10'
            }`}>
              {aiKeyModalProvider === 'claude' && <AnthropicIcon className="h-6 w-6 text-violet-500" />}
              {aiKeyModalProvider === 'gemini' && <GoogleIcon className="h-6 w-6" />}
              {aiKeyModalProvider === 'groq' && <GroqIcon className="h-6 w-6 text-orange-500" />}
            </div>
            <div>
              <DialogTitle>
                Clé API {aiKeyModalProvider === 'claude' ? 'Claude (Anthropic)' : aiKeyModalProvider === 'gemini' ? 'Gemini (Google)' : 'Groq'}
              </DialogTitle>
              <DialogDescription>Entrez votre clé API personnelle</DialogDescription>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Input
                type={aiKeyModalShow ? 'text' : 'password'}
                value={aiKeyModalValue}
                onChange={(e) => setAiKeyModalValue(e.target.value)}
                placeholder={aiKeyModalProvider === 'claude' ? 'sk-ant-api03-...' : aiKeyModalProvider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setAiKeyModalShow(!aiKeyModalShow)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {aiKeyModalShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <a
              href={aiKeyModalProvider === 'claude' ? 'https://console.anthropic.com/settings/keys' : aiKeyModalProvider === 'gemini' ? 'https://aistudio.google.com/apikey' : 'https://console.groq.com/keys'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Obtenir une clé {aiKeyModalProvider === 'claude' ? 'Anthropic' : aiKeyModalProvider === 'gemini' ? 'Google AI' : 'Groq'}
            </a>
            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Votre clé est chiffrée de bout en bout et ne sera jamais visible en clair après l&apos;enregistrement.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiKeyModalProvider(null)}>Annuler</Button>
            <Button
              disabled={!aiKeyModalValue.trim()}
              onClick={() => {
                if (!aiKeyModalProvider || !aiKeyModalValue.trim()) return
                const keyField = aiKeyModalProvider === 'claude' ? 'aiApiKeyClaude' : aiKeyModalProvider === 'gemini' ? 'aiApiKeyGemini' : 'aiApiKeyGroq'
                updateSettings({ [keyField]: aiKeyModalValue.trim() })
                toast('Clé API enregistrée', 'success')
                setAiKeyModalProvider(null)
                setAiKeyModalValue('')
                setAiKeyModalShow(false)
              }}
            >
              <Key className="h-4 w-4 mr-2" /> Enregistrer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* AI API Key Delete Confirmation Modal */}
      <Dialog open={aiDeleteConfirmProvider !== null} onClose={() => setAiDeleteConfirmProvider(null)}>
        <div className="p-6 max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Supprimer la clé API</DialogTitle>
              <DialogDescription>
                {aiDeleteConfirmProvider === 'claude' ? 'Claude (Anthropic)' : aiDeleteConfirmProvider === 'gemini' ? 'Gemini (Google)' : 'Groq'}
              </DialogDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Êtes-vous sûr de vouloir supprimer cette clé API ? Vous devrez en saisir une nouvelle pour utiliser ce fournisseur avec vos propres clés.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiDeleteConfirmProvider(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!aiDeleteConfirmProvider) return
                const keyField = aiDeleteConfirmProvider === 'claude' ? 'aiApiKeyClaude' : aiDeleteConfirmProvider === 'gemini' ? 'aiApiKeyGemini' : 'aiApiKeyGroq'
                updateSettings({ [keyField]: null })
                // If we just deleted the key for the active provider, switch to another provider that has a key
                if (settings.aiProvider === aiDeleteConfirmProvider) {
                  const fallbacks = ['gemini', 'groq', 'claude'] as const
                  const next = fallbacks.find((p) => p !== aiDeleteConfirmProvider && settings[`aiApiKey${p.charAt(0).toUpperCase() + p.slice(1)}` as keyof typeof settings])
                  if (next) {
                    updateSettings({ aiProvider: next, aiModel: defaultModels[next] })
                  }
                }
                toast('Clé API supprimée', 'success')
                setAiDeleteConfirmProvider(null)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}
