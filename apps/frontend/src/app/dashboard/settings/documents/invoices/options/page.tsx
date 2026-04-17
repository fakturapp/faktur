'use client'

import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

const VAT_RATE_PRESETS = [0, 2.1, 5.5, 10, 20]

export default function InvoiceOptionsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const isDetailedBilling = settings.billingType === 'detailed'

  if (loading) {
    return (
      <div className="space-y-6 px-4 py-4 md:py-6 lg:px-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-border/50 p-6">
              <div className="mb-4 flex items-center gap-3">
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
            <div className="rounded-xl border border-border/50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/50">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="bg-surface p-4">
              <Skeleton className="w-full rounded-lg" style={{ aspectRatio: '210/270' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 py-4 md:py-6 lg:px-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Options</h1>
        <p className="mt-1 text-muted-foreground">Type de facturation et moyens de paiement</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <motion.div variants={fadeUp} custom={1}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <ClipboardList className="h-4.5 w-4.5 text-accent" />
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
                        : 'border-border hover:border-muted-foreground/30 hover:bg-surface'
                    }`}
                  >
                    {settings.billingType === 'quick' && (
                      <div className="absolute right-3 top-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-accent-foreground" />
                        </div>
                      </div>
                    )}
                    <Zap className="mb-2 h-5 w-5 text-accent" />
                    <p className="text-sm font-medium text-foreground">Rapide</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Facturation simplifiee avec les informations essentielles
                    </p>
                  </button>
                  <button
                    onClick={() => updateSettings({ billingType: 'detailed' })}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      settings.billingType === 'detailed'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-surface'
                    }`}
                  >
                    {settings.billingType === 'detailed' && (
                      <div className="absolute right-3 top-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-accent-foreground" />
                        </div>
                      </div>
                    )}
                    <ClipboardList className="mb-2 h-5 w-5 text-accent" />
                    <p className="text-sm font-medium text-foreground">Complet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Factures detaillees avec TVA, remises, conditions et mentions
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Options du document</h2>
                    <p className="text-xs text-muted-foreground">Sections affichees par defaut sur vos documents</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'defaultSignatureField' as const,
                      label: 'Champ de signature',
                      desc: 'Afficher les zones de signature emetteur et client',
                    },
                    {
                      key: 'defaultShowNotes' as const,
                      label: 'Notes et conditions',
                      desc: 'Afficher la zone de notes et conditions',
                    },
                    {
                      key: 'defaultShowDeliveryAddress' as const,
                      label: 'Adresse de livraison',
                      desc: 'Afficher un champ adresse de livraison',
                    },
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
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                            settings[opt.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {isDetailedBilling && (
                  <div className="mt-5 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Colonnes du mode complet</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ces reglages servent de base pour les nouveaux documents en mode complet.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          key: 'defaultShowQuantityColumn' as const,
                          label: 'Quantite',
                          desc: 'Afficher la colonne quantite',
                        },
                        {
                          key: 'defaultShowUnitColumn' as const,
                          label: 'Unite',
                          desc: 'Afficher la colonne unite',
                        },
                        {
                          key: 'defaultShowUnitPriceColumn' as const,
                          label: 'Prix unitaire HT',
                          desc: 'Afficher la colonne de prix unitaire HT',
                        },
                        {
                          key: 'defaultShowVatColumn' as const,
                          label: 'Taux de TVA',
                          desc: 'Afficher la colonne du pourcentage de TVA',
                        },
                      ].map((opt) => (
                        <div key={opt.key} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 p-3">
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
                            <span
                              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                settings[opt.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    {settings.defaultShowVatColumn && (
                      <div className="mt-4 border-t border-border/70 pt-4">
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Taux de TVA par defaut
                        </label>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {VAT_RATE_PRESETS.map((rate) => {
                            const isActive = Math.abs((settings.defaultVatRate ?? 20) - rate) < 0.001
                            return (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => updateSettings({ defaultVatRate: rate })}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  isActive
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-background hover:border-muted-foreground/40'
                                }`}
                              >
                                {rate}%
                              </button>
                            )
                          })}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={String(settings.defaultVatRate ?? 20)}
                          onChange={(e) => {
                            const next = Number(e.target.value)
                            updateSettings({ defaultVatRate: Number.isFinite(next) ? next : 0 })
                          }}
                          className="text-sm"
                        />
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Applique aux nouvelles lignes vides. Les produits du catalogue gardent leur propre TVA.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} custom={3}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <Languages className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Langue par defaut</h2>
                    <p className="text-xs text-muted-foreground">Langue utilisee a la creation d&apos;un document</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'fr', label: 'Francais' },
                    { id: 'en', label: 'English' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => updateSettings({ defaultLanguage: lang.id })}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        settings.defaultLanguage === lang.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{lang.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="flex justify-end">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-green-500" />
              Enregistrement automatique
            </p>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} custom={1}>
          <InvoicePreview />
        </motion.div>
      </div>
    </motion.div>
  )
}
