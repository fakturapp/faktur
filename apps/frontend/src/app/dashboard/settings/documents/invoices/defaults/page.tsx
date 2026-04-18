'use client'

import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { InvoicePreview } from '@/components/settings/invoice-preview'
import { ClipboardList, FileText, Check } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function InvoiceDefaultsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        {}
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        {}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
                <Skeleton className="h-px w-full" />
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
            {}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
                <Skeleton className="h-28 w-full rounded-lg" />
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
            <div className="p-4 bg-surface">
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
        <h1 className="text-2xl font-bold text-foreground">Valeurs par d&eacute;faut</h1>
        <p className="text-muted-foreground mt-1">Pr&eacute;-remplissage automatique de vos documents</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {}
        <div className="space-y-6">
          {}
          <motion.div variants={fadeUp} custom={1}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <ClipboardList className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Valeurs par d&eacute;faut des devis</h2>
                    <p className="text-xs text-muted-foreground">Pr&eacute;-remplissage automatique lors de la cr&eacute;ation d&apos;un devis</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Objet par d&eacute;faut</label>
                    <Input
                      placeholder="Ex: Developpement site web"
                      value={settings.defaultSubject || ''}
                      onChange={(e) => updateSettings({ defaultSubject: e.target.value || null })}
                      className="text-sm"
                    />
                  </div>

                  {}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Conditions d&apos;acceptation</label>
                    <textarea
                      placeholder="Conditions d'acceptation par d&eacute;faut..."
                      value={settings.defaultAcceptanceConditions || ''}
                      onChange={(e) => updateSettings({ defaultAcceptanceConditions: e.target.value || null })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[60px]"
                      rows={2}
                    />
                  </div>

                  {}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Champ libre</label>
                    <textarea
                      placeholder="Texte suppl&eacute;mentaire par d&eacute;faut..."
                      value={settings.defaultFreeField || ''}
                      onChange={(e) => updateSettings({ defaultFreeField: e.target.value || null })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[60px]"
                      rows={2}
                    />
                  </div>

                  {}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Pied de page du document</label>
                    <div className="space-y-2">
                      {([
                        { id: 'company_info' as const, label: 'Informations entreprise', desc: 'Raison sociale, SIREN, TVA, adresse' },
                        { id: 'custom' as const, label: 'Texte personnalis\u00e9', desc: 'Saisissez votre propre texte de pied de page' },
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => updateSettings({ footerMode: opt.id })}
                          className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                            settings.footerMode === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                            settings.footerMode === opt.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {settings.footerMode === opt.id && <Check className="h-3 w-3 text-accent-foreground" />}
                          </div>
                        </button>
                      ))}
                    </div>
                    {settings.footerMode === 'custom' && (
                      <div className="mt-2">
                        <Input
                          placeholder="Ex: Conditions g&eacute;n&eacute;rales de vente..."
                          value={settings.defaultFooterText || ''}
                          onChange={(e) => updateSettings({ defaultFooterText: e.target.value?.slice(0, 50) || null })}
                          className="text-sm"
                          maxLength={50}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">50 caract&egrave;res max.</p>
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ═══════════════════════════════════════
               Card 2: Nommage des fichiers
             ═══════════════════════════════════════ */}
          <motion.div variants={fadeUp} custom={2}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <FileText className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Nommage des fichiers</h2>
                    <p className="text-xs text-muted-foreground">Format du nom de fichier lors de l&apos;export PDF</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Quote filename pattern */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Nom de fichier des devis</label>
                    <Input
                      placeholder="DEV-{num&eacute;ro}"
                      value={settings.quoteFilenamePattern}
                      onChange={(e) => updateSettings({ quoteFilenamePattern: e.target.value })}
                      className="text-sm font-mono"
                    />
                  </div>

                  {/* Invoice filename pattern */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Nom de fichier des factures</label>
                    <Input
                      placeholder="FAC-{num&eacute;ro}"
                      value={settings.invoiceFilenamePattern}
                      onChange={(e) => updateSettings({ invoiceFilenamePattern: e.target.value })}
                      className="text-sm font-mono"
                    />
                  </div>

                  {/* Variables */}
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground mb-2">Variables disponibles</p>
                    {[
                      { var: '{numero}', desc: 'Num\u00e9ro du document (ex: DEV-001)' },
                      { var: '{date}', desc: "Date d'\u00e9mission (ex: 2026-03-15)" },
                      { var: '{client}', desc: 'Nom du client' },
                      { var: '{entreprise}', desc: 'Nom de votre entreprise' },
                    ].map((v) => (
                      <div key={v.var} className="flex items-center gap-2">
                        <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded text-accent">{v.var}</code>
                        <span className="text-[11px] text-muted-foreground">{v.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview Column */}
        <motion.div variants={fadeUp} custom={2}>
          <InvoicePreview />
        </motion.div>
      </div>
    </motion.div>
  )
}
