'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import {
  FileCheck,
  Info,
  Shield,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react'

export default function EInvoicingPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const { toast } = useToast()

  const [showPdpKey, setShowPdpKey] = useState(false)
  const [showEInvoicingModal, setShowEInvoicingModal] = useState(false)
  const [showBetaWarningModal, setShowBetaWarningModal] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="rounded-xl border border-border/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <Separator />
          <div className="space-y-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-52" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        {}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground tracking-tight">E-Facturation</h1>
          <p className="text-sm text-muted-foreground">Reforme 2026 — Factur-X, PDP et e-reporting</p>
        </div>

        {}
        <Card className="border-border/50">
          <CardContent className="p-6">
            {}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                <FileCheck className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Facturation electronique</h2>
                <p className="text-xs text-muted-foreground">Reforme 2026 — Factur-X, PDP et e-reporting</p>
              </div>
            </div>

            {}
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
              <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                A partir de septembre 2026, toutes les entreprises francaises doivent emettre des factures electroniques au format structure (Factur-X, UBL ou CII) via une Plateforme de Dematerialisation Partenaire (PDP).
              </p>
            </div>

            {}
            <div className="flex items-center justify-between rounded-xl border-2 border-border p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.eInvoicingEnabled ? 'bg-accent-soft' : 'bg-muted'}`}>
                  <Shield className={`h-5 w-5 ${settings.eInvoicingEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Activer la facturation electronique</p>
                  <p className="text-xs text-muted-foreground">Genere automatiquement le format Factur-X pour vos documents</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!settings.eInvoicingEnabled) setShowEInvoicingModal(true)
                  else updateSettings({ eInvoicingEnabled: false })
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  settings.eInvoicingEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                  settings.eInvoicingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* PDP Configuration */}
            <AnimatePresence>
              {settings.eInvoicingEnabled && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-4 pt-2">
                    <Separator />

                    {/* B2Brouter API key (optional -- sandbox by default) */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Cle API B2Brouter (optionnel)</label>
                      <div className="relative">
                        <Input
                          type={showPdpKey ? 'text' : 'password'}
                          placeholder="Laissez vide pour le mode sandbox..."
                          value={settings.pdpApiKey === '••••••••' ? '' : (settings.pdpApiKey || '')}
                          onChange={(e) => updateSettings({ pdpApiKey: e.target.value, pdpProvider: e.target.value ? 'b2brouter' : 'sandbox' })}
                          className="text-sm pr-10 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPdpKey(!showPdpKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPdpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {settings.pdpApiKey && settings.pdpApiKey !== '••••••••'
                          ? 'Connecte a B2Brouter — les factures seront envoyees a la PDP'
                          : 'Mode sandbox actif — les factures sont generees localement sans envoi PDP'}
                      </p>
                    </div>

                    {/* Default operation category */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Categorie d&apos;operation par defaut</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'service', name: 'Prestation', desc: 'Services' },
                          { id: 'goods', name: 'Livraison', desc: 'Biens' },
                          { id: 'mixed', name: 'Mixte', desc: 'Les deux' },
                        ].map((cat) => (
                          <button key={cat.id} onClick={() => updateSettings({ defaultOperationCategory: cat.id as any })}
                            className={`rounded-xl border-2 p-3 text-left transition-all ${
                              settings.defaultOperationCategory === cat.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                            }`}>
                            <p className="text-xs font-medium text-foreground">{cat.name}</p>
                            <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sandbox indicator */}
                    <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {settings.pdpApiKey && settings.pdpApiKey !== '••••••••' ? 'Mode production' : 'Mode sandbox'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {settings.pdpApiKey && settings.pdpApiKey !== '••••••••'
                            ? 'Les factures sont envoyees via B2Brouter vers la DGFiP'
                            : 'Aucune facture n\'est envoyee — generation Factur-X locale uniquement'}
                        </p>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <p className="text-xs font-medium text-foreground mb-2">Fonctionnalites incluses</p>
                      {[
                        'Generation automatique Factur-X EN16931 (PDF/A-3)',
                        'Mentions obligatoires reforme 2026',
                        'SIREN client et categorie d\'operation',
                        'Envoi via B2Brouter vers la DGFiP (avec cle API)',
                        'Suivi des statuts en temps reel',
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="text-[11px] text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Auto-save indicator */}
        <div className="flex justify-end">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Enregistrement automatique
          </p>
        </div>
      </div>

      {/* E-Invoicing Confirmation Modal */}
      <Dialog open={showEInvoicingModal} onClose={() => setShowEInvoicingModal(false)}>
        <div className="p-6 max-w-md">
          <DialogHeader onClose={() => setShowEInvoicingModal(false)} icon={<FileCheck className="h-5 w-5 text-accent" />}>
            <DialogTitle>Activer la facturation electronique</DialogTitle>
            <DialogDescription>Reforme obligatoire a partir de septembre 2026</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              En activant cette option, vos documents seront generes au format Factur-X (PDF/A-3) conforme aux exigences de la reforme francaise.
            </p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Vos PDF incluront les metadonnees XML structurees',
                'Compatible avec toutes les PDP agreees',
                'Aucun impact sur vos documents existants',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEInvoicingModal(false)}>Annuler</Button>
            <Button onClick={() => { updateSettings({ eInvoicingEnabled: true }); setShowEInvoicingModal(false); setShowBetaWarningModal(true) }}>
              <FileCheck className="h-4 w-4 mr-2" /> Activer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Beta Warning Modal */}
      <Dialog open={showBetaWarningModal} onClose={() => setShowBetaWarningModal(false)}>
        <div className="p-6 max-w-md">
          <DialogHeader onClose={() => setShowBetaWarningModal(false)} icon={<FlaskConical className="h-5 w-5 text-yellow-500" />}>
            <DialogTitle className="flex items-center gap-2">
              Fonctionnalite en beta
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-semibold uppercase tracking-wide">Beta</span>
            </DialogTitle>
            <DialogDescription>Apercu anticipe de la facturation electronique</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mb-6">
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Cette fonctionnalite est actuellement en <strong>version beta</strong>. Elle peut presenter des dysfonctionnements ou ne pas fonctionner correctement dans certains cas.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nous travaillons activement sur cette fonctionnalite. Elle sera <strong className="text-foreground">pleinement operationnelle avant septembre 2026</strong>, bien avant l&apos;entree en vigueur de la reforme.
            </p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Les formats generes peuvent evoluer',
                'Certaines PDP ne sont pas encore connectees',
                'Vos donnees existantes ne seront pas affectees',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowBetaWarningModal(false); toast('Facturation electronique activee', 'success') }}>
              J&apos;ai compris
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  )
}
