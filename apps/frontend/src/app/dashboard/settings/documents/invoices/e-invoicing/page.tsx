'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  FileCheck,
  Info,
  Shield,
  Check,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Loader2,
  Search,
  ExternalLink,
  BookOpen,
  Zap,
  Building2,
  Globe,
  Send,
  ChevronRight,
} from 'lucide-react'

interface ConnectionResult {
  connected: boolean
  message: string
  accountId?: string
}

export default function EInvoicingPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const { toast } = useToast()

  const [showPdpKey, setShowPdpKey] = useState(false)
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionResult | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const [directorySearch, setDirectorySearch] = useState('')
  const [directoryResult, setDirectoryResult] = useState<any>(null)
  const [searchingDirectory, setSearchingDirectory] = useState(false)

  const testConnection = useCallback(async () => {
    setTestingConnection(true)
    setConnectionStatus(null)
    try {
      const res = await api.get<ConnectionResult>('/einvoicing/validate-connection')
      if (res.data) {
        setConnectionStatus(res.data)
        if (res.data.connected) {
          toast('Connexion B2Brouter reussie', 'success')
          if (res.data.accountId && !settings.b2bAccountId) {
            updateSettings({ b2bAccountId: res.data.accountId })
          }
        }
      }
    } catch {
      setConnectionStatus({ connected: false, message: 'Erreur de connexion' })
    } finally {
      setTestingConnection(false)
    }
  }, [settings.b2bAccountId, toast, updateSettings])

  const handleApiKeySave = useCallback(async () => {
    if (!apiKeyInput.trim()) return
    await updateSettings({
      pdpApiKey: apiKeyInput.trim(),
      pdpProvider: 'b2brouter',
      pdpSandbox: false,
    })
    setApiKeyInput('')
    toast('Cle API enregistree', 'success')
    setTimeout(() => testConnection(), 500)
  }, [apiKeyInput, updateSettings, toast, testConnection])

  const handleApiKeyRemove = useCallback(async () => {
    await updateSettings({
      pdpApiKey: null,
      pdpProvider: 'sandbox',
      pdpSandbox: false,
      b2bAccountId: null,
    })
    setConnectionStatus(null)
    toast('Cle API supprimee', 'info')
  }, [updateSettings, toast])

  const searchDirectory = useCallback(async () => {
    if (!directorySearch.trim() || directorySearch.length < 9) return
    setSearchingDirectory(true)
    setDirectoryResult(null)
    try {
      const res = await api.get<any>(`/einvoicing/directory?siret=${encodeURIComponent(directorySearch.trim())}`)
      if (res.data) setDirectoryResult(res.data)
    } catch {
      setDirectoryResult({ found: false, message: 'Erreur de recherche' })
    } finally {
      setSearchingDirectory(false)
    }
  }, [directorySearch])

  const hasApiKey = settings.pdpApiKey && !settings.pdpApiKey.startsWith('••••')
  const isConnected = hasApiKey || (settings.pdpApiKey && settings.pdpApiKey.length > 4)

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground tracking-tight">E-Facturation</h1>
            <p className="text-sm text-muted-foreground">Reforme 2026 — Factur-X, Plateforme Agreee et e-reporting</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowOnboardingModal(true)} className="text-xs gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Comment ca marche
          </Button>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                <FileCheck className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Facturation electronique</h2>
                <p className="text-xs text-muted-foreground">Obligatoire a partir de septembre 2026</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
              <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                FactorPro utilise <strong>B2Brouter</strong>, une Plateforme Agreee (PA) immatriculee par la DGFiP. B2Brouter gere la transmission, le e-reporting et l&apos;interoperabilite PEPPOL.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border-2 border-border p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.eInvoicingEnabled ? 'bg-accent-soft' : 'bg-muted'}`}>
                  <Shield className={`h-5 w-5 ${settings.eInvoicingEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Activer la facturation electronique</p>
                  <p className="text-xs text-muted-foreground">Genere le format Factur-X et active la transmission PA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!settings.eInvoicingEnabled) setShowActivationModal(true)
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

            <AnimatePresence>
              {settings.eInvoicingEnabled && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-4 pt-2">
                    <Separator />

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Cle API B2Brouter</label>
                      {isConnected ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                              <Wifi className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">Connecte a B2Brouter</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {settings.pdpApiKey}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button variant="ghost" size="sm" onClick={testConnection} disabled={testingConnection} className="text-xs h-8">
                                {testingConnection ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleApiKeyRemove} className="text-xs h-8 text-red-500 hover:text-red-600">
                                Supprimer
                              </Button>
                            </div>
                          </div>

                          {connectionStatus && (
                            <div className={`flex items-center gap-2 rounded-lg border p-3 ${
                              connectionStatus.connected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                            }`}>
                              {connectionStatus.connected
                                ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                : <WifiOff className="h-4 w-4 text-red-500 shrink-0" />
                              }
                              <div>
                                <p className="text-xs font-medium text-foreground">{connectionStatus.message}</p>
                                {connectionStatus.accountId && (
                                  <p className="text-[10px] text-muted-foreground">Compte: {connectionStatus.accountId}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type={showPdpKey ? 'text' : 'password'}
                                placeholder="Collez votre cle API B2Brouter..."
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                className="text-sm pr-10 font-mono"
                                onKeyDown={(e) => e.key === 'Enter' && handleApiKeySave()}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPdpKey(!showPdpKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPdpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <Button onClick={handleApiKeySave} disabled={!apiKeyInput.trim()} className="shrink-0">
                              Connecter
                            </Button>
                          </div>
                          <div className="flex items-start gap-2 rounded-lg border border-border p-3">
                            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Creez un compte sur{' '}
                              <a href="https://www.b2brouter.net/fr/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5">
                                b2brouter.net <ExternalLink className="h-2.5 w-2.5" />
                              </a>{' '}
                              puis recuperez votre cle API dans les parametres de votre espace.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Categorie d&apos;operation par defaut</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'service', name: 'Prestation', desc: 'Services', icon: Zap },
                          { id: 'goods', name: 'Livraison', desc: 'Biens', icon: Building2 },
                          { id: 'mixed', name: 'Mixte', desc: 'Les deux', icon: Globe },
                        ].map((cat) => {
                          const Icon = cat.icon
                          return (
                            <button key={cat.id} onClick={() => updateSettings({ defaultOperationCategory: cat.id as any })}
                              className={`rounded-xl border-2 p-3 text-left transition-all ${
                                settings.defaultOperationCategory === cat.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                              }`}>
                              <Icon className={`h-4 w-4 mb-1.5 ${settings.defaultOperationCategory === cat.id ? 'text-primary' : 'text-muted-foreground'}`} />
                              <p className="text-xs font-medium text-foreground">{cat.name}</p>
                              <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {isConnected && (
                      <>
                        <Separator />
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Annuaire PPF — Verifier un destinataire</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="SIRET du destinataire (14 chiffres)..."
                              value={directorySearch}
                              onChange={(e) => setDirectorySearch(e.target.value.replace(/\D/g, '').slice(0, 14))}
                              className="text-sm font-mono"
                              onKeyDown={(e) => e.key === 'Enter' && searchDirectory()}
                            />
                            <Button variant="outline" onClick={searchDirectory} disabled={searchingDirectory || directorySearch.length < 9} className="shrink-0">
                              {searchingDirectory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                          </div>
                          {directoryResult && (
                            <div className={`mt-2 flex items-center gap-2 rounded-lg border p-3 ${
                              directoryResult.found ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-yellow-500/20 bg-yellow-500/5'
                            }`}>
                              {directoryResult.found
                                ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                : <Info className="h-4 w-4 text-yellow-500 shrink-0" />
                              }
                              <div>
                                <p className="text-xs font-medium text-foreground">{directoryResult.message}</p>
                                {directoryResult.platform && (
                                  <p className="text-[10px] text-muted-foreground">Plateforme: {directoryResult.platform}</p>
                                )}
                                {directoryResult.peppol && (
                                  <p className="text-[10px] text-muted-foreground">Reseau PEPPOL actif</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <p className="text-xs font-medium text-foreground mb-2">Fonctionnalites incluses</p>
                      {[
                        'Generation Factur-X EN16931 (XML CII embarque dans PDF/A-3)',
                        'Transmission automatique via B2Brouter (PA immatriculee DGFiP)',
                        'E-reporting B2C et international (Flux 1 + Flux 10)',
                        'Annuaire PPF — verification des destinataires',
                        'Suivi du cycle de vie des factures en temps reel',
                        'Webhooks pour mise a jour automatique des statuts',
                        'Interoperabilite PEPPOL BIS 3.0',
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

        <div className="flex justify-end">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Enregistrement automatique
          </p>
        </div>
      </div>

      <Dialog open={showActivationModal} onClose={() => setShowActivationModal(false)}>
        <div className="p-6 max-w-md">
          <DialogHeader onClose={() => setShowActivationModal(false)} icon={<FileCheck className="h-5 w-5 text-accent" />}>
            <DialogTitle>Activer la facturation electronique</DialogTitle>
            <DialogDescription>Obligatoire a partir de septembre 2026</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              En activant cette option, vos factures seront generees au format Factur-X (PDF/A-3) conforme a la norme EN 16931.
            </p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Vos PDF incluront les metadonnees XML structurees',
                'Compatible avec toutes les Plateformes Agreees',
                'Connectez B2Brouter pour la transmission DGFiP',
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
            <Button variant="ghost" onClick={() => setShowActivationModal(false)}>Annuler</Button>
            <Button onClick={() => {
              updateSettings({ eInvoicingEnabled: true })
              setShowActivationModal(false)
              toast('Facturation electronique activee', 'success')
            }}>
              <FileCheck className="h-4 w-4 mr-2" /> Activer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={showOnboardingModal} onClose={() => setShowOnboardingModal(false)}>
        <div className="p-6 max-w-lg">
          <DialogHeader onClose={() => setShowOnboardingModal(false)} icon={<BookOpen className="h-5 w-5 text-accent" />}>
            <DialogTitle>Comment configurer la facturation electronique</DialogTitle>
            <DialogDescription>Guide pas a pas pour etre conforme a la reforme 2026</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1">
            {[
              {
                step: 1,
                title: 'Activez la facturation electronique',
                desc: 'Activez le toggle ci-dessus. Vos factures seront automatiquement generees au format Factur-X (PDF/A-3 avec XML CII embarque).',
                icon: Shield,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                step: 2,
                title: 'Creez un compte B2Brouter',
                desc: 'Rendez-vous sur b2brouter.net et creez votre compte entreprise. B2Brouter est une Plateforme Agreee (PA) immatriculee par la DGFiP. Gratuit jusqu\'au 31 aout 2026.',
                icon: Building2,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
                link: { href: 'https://www.b2brouter.net/fr/', label: 'Ouvrir B2Brouter' },
              },
              {
                step: 3,
                title: 'Recuperez votre cle API',
                desc: 'Dans votre espace B2Brouter, allez dans Parametres > API et copiez votre cle. Collez-la dans le champ "Cle API B2Brouter" ci-dessus.',
                icon: Zap,
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
              {
                step: 4,
                title: 'Verifiez la connexion',
                desc: 'Une fois la cle inseree, FactorPro teste automatiquement la connexion. Vous verrez le statut "Connecte" avec les premiers caracteres de votre cle masques.',
                icon: Wifi,
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
              },
              {
                step: 5,
                title: 'Soumettez vos factures',
                desc: 'Depuis la liste de vos factures, utilisez le bouton "Soumettre" pour envoyer une facture via B2Brouter. Le statut est suivi en temps reel (deposee, acceptee, rejetee...).',
                icon: Send,
                color: 'text-indigo-500',
                bg: 'bg-indigo-500/10',
              },
            ].map((item) => {
              const StepIcon = item.icon
              return (
                <div key={item.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.bg}`}>
                      <span className={`text-xs font-bold ${item.color}`}>{item.step}</span>
                    </div>
                    {item.step < 5 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <StepIcon className={`h-4 w-4 ${item.color}`} />
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    {item.link && (
                      <a href={item.link.href} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-accent hover:underline">
                        {item.link.label} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}

            <Separator />

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium text-foreground mb-2">Ce que B2Brouter gere pour vous :</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Transmission a la DGFiP',
                  'E-reporting B2C + international',
                  'Annuaire PPF (destinataires)',
                  'Interoperabilite PEPPOL',
                  'Conversion UBL/CII/Factur-X',
                  'Archivage legal',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-accent shrink-0" />
                    <span className="text-[10px] text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowOnboardingModal(false)}>
              J&apos;ai compris <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  )
}
