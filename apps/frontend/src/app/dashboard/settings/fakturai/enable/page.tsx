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
import { FakturAiIcon } from '@/components/icons/faktur-ai-icon'
import {
  Sparkles,
  FlaskConical,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react'

export default function FakturAiEnablePage() {
  const { toast } = useToast()
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const [showAiBetaModal, setShowAiBetaModal] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FakturAiIcon className="h-5 w-5 text-primary" />
          Activation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Activez ou desactivez Faktur AI pour vos factures et devis
        </p>
      </div>

      {/* Toggle card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.aiEnabled ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10' : 'bg-muted'}`}>
                <FakturAiIcon className={`h-5 w-5 ${settings.aiEnabled ? 'text-indigo-400' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Activer Faktur AI</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[8px] font-semibold uppercase">Beta</span>
                </div>
                <p className="text-xs text-muted-foreground">Active Faktur AI dans toute l&apos;application</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!settings.aiEnabled) {
                  setShowAiBetaModal(true)
                } else {
                  updateSettings({ aiEnabled: false })
                  toast('Faktur AI desactive', 'success')
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                settings.aiEnabled ? 'bg-indigo-500' : 'bg-muted-foreground/30'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                settings.aiEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <AnimatePresence>
            {settings.aiEnabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Separator className="my-4" />
                <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <FlaskConical className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-yellow-500">Fonctionnalite en beta</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      Faktur AI est en developpement actif. L&apos;assistant vous aide a modifier, analyser et optimiser vos factures et devis.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2.5 mt-4">
                  <p className="text-xs font-semibold text-foreground">Fonctionnalites incluses</p>
                  {[
                    { text: 'Edition assistee des factures et devis', available: true },
                    { text: 'Analyse de conformite legale', available: true },
                    { text: 'Mode libre creatif', available: true },
                    { text: 'Multi-fournisseur (Gemini, Groq, Claude)', available: true },
                    { text: 'Resume financier IA sur le tableau de bord', available: false },
                    { text: 'Relances de paiement automatiques', available: false },
                  ].map((feature) => (
                    <div key={feature.text} className="flex items-center gap-2.5">
                      {feature.available ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="h-3.5 w-3.5 flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-muted-foreground">--</span>
                        </span>
                      )}
                      <span className={`text-[11px] ${feature.available ? 'text-foreground' : 'text-muted-foreground/50'}`}>{feature.text}</span>
                      {!feature.available && (
                        <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Bientot</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Beta Activation Modal */}
      <Dialog open={showAiBetaModal} onClose={() => setShowAiBetaModal(false)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Activer Faktur AI
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-semibold uppercase tracking-wide">Beta</span>
              </DialogTitle>
              <DialogDescription>Assistant intelligent pour vos documents</DialogDescription>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Faktur AI est actuellement en <strong>version beta</strong>. Les reponses generees par l&apos;IA peuvent contenir des erreurs.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Verifiez toujours les suggestions de l\'IA avant de les appliquer',
                'Les donnees de vos documents ne quittent pas votre session',
                'Vous pouvez desactiver l\'IA a tout moment',
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
            <Button
              onClick={() => { updateSettings({ aiEnabled: true }); setShowAiBetaModal(false); toast('Faktur AI active', 'success') }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Activer Faktur AI
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}
