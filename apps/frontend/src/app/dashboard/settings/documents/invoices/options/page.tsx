'use client'

import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { InvoicePreview } from '@/components/settings/invoice-preview'
import {
  Zap,
  ClipboardList,
  SlidersHorizontal,
  Languages,
  Check,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function InvoiceOptionsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        {}
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        {}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            </div>
            {}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          {}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="p-4 bg-muted/30">
              <Skeleton className="w-full rounded-lg" style={{ aspectRatio: '210/270' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Options</h1>
        <p className="text-muted-foreground mt-1">Type de facturation et moyens de paiement</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {}
        <div className="space-y-6">
          {}
          <motion.div variants={fadeUp} custom={1}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Modele de facturation</h2>
                    <p className="text-xs text-muted-foreground">Choisissez le type de facture par defaut</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSettings({ billingType: 'quick' })}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      settings.billingType === 'quick'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    {settings.billingType === 'quick' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <Zap className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm text-foreground">Rapide</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Facturation simplifiee avec les informations essentielles
                    </p>
                  </button>
                  <button
                    onClick={() => updateSettings({ billingType: 'detailed' })}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      settings.billingType === 'detailed'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    {settings.billingType === 'detailed' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <ClipboardList className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm text-foreground">Complet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Factures detaillees avec TVA, remises, conditions et mentions
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Document Toggles */}
          <motion.div variants={fadeUp} custom={2}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Options du document</h2>
                    <p className="text-xs text-muted-foreground">Sections affichées par défaut sur vos documents</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'defaultSignatureField' as const, label: 'Champ de signature', desc: 'Afficher les zones de signature émetteur/client' },
                    { key: 'defaultShowNotes' as const, label: 'Notes et conditions', desc: 'Afficher la zone de notes et conditions' },
                    { key: 'defaultShowDeliveryAddress' as const, label: 'Adresse de livraison', desc: 'Afficher un champ adresse de livraison' },
                  ].map((opt) => (
                    <div key={opt.key} className="flex items-center justify-between rounded-xl border-2 border-border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSettings({ [opt.key]: !settings[opt.key] })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                          settings[opt.key] ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${
                          settings[opt.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Default Language */}
          <motion.div variants={fadeUp} custom={3}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Languages className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Langue par défaut</h2>
                    <p className="text-xs text-muted-foreground">Langue utilisée à la création d&apos;un document</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'fr', label: 'Français' },
                    { id: 'en', label: 'English' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => updateSettings({ defaultLanguage: lang.id })}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        settings.defaultLanguage === lang.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{lang.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Auto-save indicator */}
          <motion.div variants={fadeUp} custom={4} className="flex justify-end">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-500" />
              Enregistrement automatique
            </p>
          </motion.div>
        </div>

        {/* Preview Column */}
        <motion.div variants={fadeUp} custom={1}>
          <InvoicePreview />
        </motion.div>
      </div>
    </motion.div>
  )
}
