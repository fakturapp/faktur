'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Hash, Keyboard, FileText, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

function resolvePreview(pattern: string): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const date = now.toISOString().slice(0, 10)
  return (pattern || '')
    .replace(/\{num(?:ero|éro)\}/gi, '001')
    .replace(/\{ann(?:ee|ée)\}/gi, year)
    .replace(/\{mois\}/gi, month)
    .replace(/\{date\}/gi, date)
    .replace(/\{client\}/gi, 'Client')
    .replace(/\{entreprise\}/gi, 'Société')
}

const VARIABLES: { var: string; desc: string }[] = [
  { var: '{numero}', desc: 'Compteur incrémenté (ex: 001)' },
  { var: '{annee}', desc: 'Année courante (ex: 2026)' },
  { var: '{mois}', desc: 'Mois courant sur 2 chiffres (ex: 04)' },
  { var: '{date}', desc: "Date d'émission (ex: 2026-03-15)" },
]

export default function NamingSettingsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const [autoInvoiceNext, setAutoInvoiceNext] = useState<string>('')
  const [autoQuoteNext, setAutoQuoteNext] = useState<string>('')

  const loadAutoNumbers = useCallback(async () => {
    const [inv, quo] = await Promise.all([
      api.get<{ nextNumber: string }>('/invoices/next-number'),
      api.get<{ nextNumber: string }>('/quotes/next-number'),
    ])
    if (inv.data?.nextNumber) setAutoInvoiceNext(inv.data.nextNumber)
    if (quo.data?.nextNumber) setAutoQuoteNext(quo.data.nextNumber)
  }, [])

  useEffect(() => {
    if (!loading) loadAutoNumbers()
  }, [loading, loadAutoNumbers, settings.invoiceNumberPattern, settings.quoteNumberPattern, settings.nextInvoiceNumber, settings.nextQuoteNumber])

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="space-y-6 max-w-3xl">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const quotePreview = resolvePreview(settings.quoteNumberPattern || 'DEV-{numero}')
  const invoicePreview = resolvePreview(settings.invoiceNumberPattern || 'FAC-{numero}')

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Nommage des documents</h1>
        <p className="text-muted-foreground mt-1">
          Configurez le format du nom et le prochain numéro de vos devis et factures
        </p>
      </motion.div>

      <div className="space-y-6 max-w-3xl">
        <motion.div variants={fadeUp} custom={1}>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                  <Hash className="h-4.5 w-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Format du nom</h2>
                  <p className="text-xs text-muted-foreground">
                    Structure du numéro affiché sur le document et le PDF
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    <Keyboard className="h-3 w-3" />
                    Format du devis
                  </label>
                  <Input
                    placeholder="DEV-{annee}-{numero}"
                    value={settings.quoteNumberPattern}
                    onChange={(e) => updateSettings({ quoteNumberPattern: e.target.value })}
                    className="text-sm font-mono"
                  />
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium uppercase tracking-wider">Aperçu</span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-foreground/80">{quotePreview}</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    <Keyboard className="h-3 w-3" />
                    Format de la facture
                  </label>
                  <Input
                    placeholder="FAC-{annee}-{numero}"
                    value={settings.invoiceNumberPattern}
                    onChange={(e) => updateSettings({ invoiceNumberPattern: e.target.value })}
                    className="text-sm font-mono"
                  />
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium uppercase tracking-wider">Aperçu</span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-foreground/80">{invoicePreview}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                  <p className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-accent" /> Variables disponibles
                  </p>
                  {VARIABLES.map((v) => (
                    <div key={v.var} className="flex items-center gap-2">
                      <code className="text-[10.5px] font-mono bg-background px-1.5 py-0.5 rounded text-accent border border-border/50">
                        {v.var}
                      </code>
                      <span className="text-[10.5px] text-muted-foreground">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={2}>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                  <FileText className="h-4.5 w-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Prochain numéro</h2>
                  <p className="text-xs text-muted-foreground">
                    Forcez la valeur exacte du prochain devis ou facture créé
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Prochain devis
                  </label>
                  <Input
                    placeholder={autoQuoteNext || 'DEV-001'}
                    value={settings.nextQuoteNumber || ''}
                    onChange={(e) => updateSettings({ nextQuoteNumber: e.target.value || null })}
                    className="text-sm font-mono"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {settings.nextQuoteNumber ? (
                      <>Le prochain devis sera numéroté <span className="font-mono text-foreground/80">{settings.nextQuoteNumber}</span></>
                    ) : (
                      <>Auto&nbsp;: prochain devis sera <span className="font-mono text-foreground/80">{autoQuoteNext || '—'}</span></>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Prochaine facture
                  </label>
                  <Input
                    placeholder={autoInvoiceNext || 'FAC-001'}
                    value={settings.nextInvoiceNumber || ''}
                    onChange={(e) => updateSettings({ nextInvoiceNumber: e.target.value || null })}
                    className="text-sm font-mono"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {settings.nextInvoiceNumber ? (
                      <>La prochaine facture sera numérotée <span className="font-mono text-foreground/80">{settings.nextInvoiceNumber}</span></>
                    ) : (
                      <>Auto&nbsp;: prochaine facture sera <span className="font-mono text-foreground/80">{autoInvoiceNext || '—'}</span></>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-[11px] text-foreground/80 leading-relaxed">
                    Cette valeur est <strong>utilisée une seule fois</strong> pour le prochain document créé,
                    puis la numérotation continue automatiquement à partir de là.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
