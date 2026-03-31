'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { storeAiDocument, type AiDocumentData } from '@/lib/ai-document'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  User,
  Building2,
  FileText,
  Wand2,
  ChevronDown,
  Settings2,
  ChevronUp,
  Zap,
  ClipboardList,
  Landmark,
  Banknote,
  CreditCard,
  Check,
} from 'lucide-react'
import { ShinyText } from '@/components/ui/shiny-text'
import { AnthropicIcon } from '@/components/icons/anthropic-icon'
import { GoogleIcon } from '@/components/icons/google-icon'
import { GroqIcon } from '@/components/icons/groq-icon'

const AI_MODEL_PREF_KEY = 'faktur_ai_model_pref'

const AI_PROVIDERS = [
  { id: 'gemini' as const, name: 'Gemini', icon: GoogleIcon, iconClass: '', iconBg: 'bg-blue-500/10' },
  { id: 'groq' as const, name: 'Groq', icon: GroqIcon, iconClass: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  { id: 'claude' as const, name: 'Claude', icon: AnthropicIcon, iconClass: 'text-violet-500', iconBg: 'bg-violet-500/10' },
] as const

const AI_MODELS: Record<string, { id: string; name: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash-lite', name: 'Flash Lite' },
    { id: 'gemini-2.5-flash', name: 'Flash' },
    { id: 'gemini-2.5-pro', name: 'Pro' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
  ],
  claude: [
    { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet' },
    { id: 'claude-opus-4-6', name: 'Opus' },
  ],
}

function loadModelPref(): { provider: string; model: string } | null {
  try {
    const raw = localStorage.getItem(AI_MODEL_PREF_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveModelPref(provider: string, model: string) {
  try { localStorage.setItem(AI_MODEL_PREF_KEY, JSON.stringify({ provider, model })) } catch {}
}

interface ClientInfo {
  id: string
  displayName: string
  type: 'company' | 'individual'
}

interface AiDocumentModalProps {
  open: boolean
  onClose: () => void
  type: 'invoice' | 'quote'
}

export function AiDocumentModal({ open, onClose, type }: AiDocumentModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { settings } = useInvoiceSettings()
  const [step, setStep] = useState<'prompt' | 'client' | 'generating'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(settings.aiProvider)
  const [selectedModel, setSelectedModel] = useState(settings.aiModel)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [billingType, setBillingType] = useState<'quick' | 'detailed'>('detailed')
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'other'>('bank_transfer')
  const [showOptions, setShowOptions] = useState(false)
  const [aiOptions, setAiOptions] = useState({
    includeSubject: true,
    includeAcceptanceConditions: false,
    vatExempt: false,
    vatExemptReason: 'not_subject' as 'not_subject' | 'france_no_vat' | 'outside_france',
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!open) {
      setStep('prompt')
      setPrompt('')
      setSelectedClient(null)
      setClientSearch('')
      setClients([])
      setShowModelDropdown(false)
      setBillingType('detailed')
      setPaymentMethod('bank_transfer')
      setShowOptions(false)
      setAiOptions({ includeSubject: true, includeAcceptanceConditions: false, vatExempt: false, vatExemptReason: 'not_subject' })
    } else {
      // Restore saved model preference or use settings
      const pref = loadModelPref()
      if (pref) {
        setSelectedProvider(pref.provider as any)
        setSelectedModel(pref.model)
      } else {
        setSelectedProvider(settings.aiProvider)
        setSelectedModel(settings.aiModel)
      }
    }
  }, [open, settings.aiProvider, settings.aiModel])

  const loadClients = useCallback(async (query: string) => {
    setLoadingClients(true)
    const { data } = await api.get<{ clients: ClientInfo[] }>(
      `/clients${query ? `?search=${encodeURIComponent(query)}` : ''}`
    )
    if (data?.clients) setClients(data.clients)
    setLoadingClients(false)
  }, [])

  useEffect(() => {
    if (step === 'client') {
      loadClients('')
    }
  }, [step, loadClients])

  useEffect(() => {
    if (step !== 'client') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadClients(clientSearch), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [clientSearch, step, loadClients])

  async function handleGenerate() {
    if (!prompt.trim()) return

    setStep('generating')
    setGenerating(true)

    saveModelPref(selectedProvider, selectedModel)

    // Build enriched prompt with options
    let enrichedPrompt = prompt.trim()
    const instructions: string[] = []
    if (billingType === 'quick') instructions.push('Génère UNE SEULE ligne avec le montant total global (facturation rapide, pas de détail)')
    else instructions.push('Génère plusieurs lignes détaillées avec quantités et prix unitaires')
    if (!aiOptions.includeSubject) instructions.push('Ne génère PAS de champ "subject" (laisse une chaîne vide)')
    if (aiOptions.includeAcceptanceConditions) instructions.push('Inclus des conditions d\'acceptation professionnelles dans "acceptanceConditions"')
    else instructions.push('Ne génère PAS de conditions d\'acceptation (laisse acceptanceConditions vide)')
    if (aiOptions.vatExempt) instructions.push('Le client est exonéré de TVA, utilise un taux de TVA à 0% pour toutes les lignes')
    if (instructions.length > 0) enrichedPrompt += '\n\nInstructions supplémentaires:\n- ' + instructions.join('\n- ')

    // Run API call + min 1s delay in parallel so animation is always visible
    const [apiResult] = await Promise.all([
      api.post<{
        document: {
          subject: string
          lines: { description: string; quantity: number; unitPrice: number; vatRate: number }[]
          notes?: string
          acceptanceConditions?: string
        }
      }>('/ai/generate-document', {
        type,
        prompt: enrichedPrompt,
        clientId: selectedClient?.id,
        provider: selectedProvider,
        model: selectedModel,
      }),
      new Promise((r) => setTimeout(r, 1500)),
    ])

    const { data, error, code } = apiResult
    setGenerating(false)

    if (error || !data?.document) {
      if (code === 'QUOTA_EXCEEDED') {
        toast('Quota atteint. Passez a AI Pro pour plus de requetes.', 'error')
      } else {
        toast(error || 'Erreur lors de la génération', 'error')
      }
      setStep('prompt')
      return
    }

    const aiDoc: AiDocumentData = {
      type,
      subject: data.document.subject,
      lines: data.document.lines,
      notes: data.document.notes || '',
      acceptanceConditions: data.document.acceptanceConditions || '',
      clientId: selectedClient?.id,
      billingType,
      paymentMethod,
    }

    storeAiDocument(aiDoc)
    onClose()
    router.push(type === 'invoice' ? '/dashboard/invoices/new' : '/dashboard/quotes/new')
  }

  const docLabel = type === 'invoice' ? 'facture' : 'devis'

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <AnimatePresence mode="wait">
        {step === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <DialogTitle className="!mb-0">Créer {type === 'invoice' ? 'une facture' : 'un devis'} avec l&apos;IA</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Décrivez le document à générer
                </p>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ex: ${type === 'invoice' ? 'Facture pour la création d\'un site web e-commerce avec 3 pages, design responsive et intégration de paiement' : 'Devis pour une refonte graphique complète incluant logo, charte graphique et supports de communication'}`}
              className="w-full h-32 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              autoFocus
            />

            {/* Model selector */}
            <div className="relative mt-3">
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="w-full flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-all hover:border-primary/30"
              >
                {(() => {
                  const p = AI_PROVIDERS.find((x) => x.id === selectedProvider)
                  const Icon = p?.icon
                  return Icon ? <Icon className={cn('h-3.5 w-3.5', p.iconClass)} /> : null
                })()}
                <span className="text-xs text-foreground font-medium flex-1">
                  {AI_PROVIDERS.find((x) => x.id === selectedProvider)?.name} — {AI_MODELS[selectedProvider]?.find((m) => m.id === selectedModel)?.name || selectedModel}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', showModelDropdown && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
                  >
                    {AI_PROVIDERS.map((p) => {
                      const hasKey = p.id === 'claude' ? !!settings.aiApiKeyClaude : p.id === 'gemini' ? !!settings.aiApiKeyGemini : !!settings.aiApiKeyGroq
                      const disabled = settings.aiKeyMode === 'custom' && !hasKey
                      const Icon = p.icon
                      return (
                        <div key={p.id}>
                          <div className={cn('px-3 py-1.5 flex items-center gap-2 border-b border-border/50 bg-muted/30', disabled && 'opacity-50')}>
                            <Icon className={cn('h-3 w-3', p.iconClass)} />
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{p.name}</span>
                            {disabled && <span className="text-[8px] text-destructive/70 ml-auto">Clé manquante</span>}
                          </div>
                          {AI_MODELS[p.id]?.map((m) => (
                            <button
                              key={m.id}
                              disabled={disabled}
                              onClick={() => {
                                setSelectedProvider(p.id)
                                setSelectedModel(m.id)
                                setShowModelDropdown(false)
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 text-left transition-all text-xs',
                                selectedProvider === p.id && selectedModel === m.id
                                  ? 'bg-primary/5 text-primary'
                                  : 'text-foreground hover:bg-muted/50',
                                disabled && 'opacity-40 cursor-not-allowed'
                              )}
                            >
                              <span className="flex-1 font-medium">{m.name}</span>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!prompt.trim()}
                onClick={() => setStep('client')}
              >
                Suivant <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'client' && (
          <motion.div
            key="client"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep('prompt')}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <DialogTitle className="!mb-0 flex-1">Sélectionner un client</DialogTitle>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Sélectionnez un client pour {type === 'invoice' ? 'la facture' : 'le devis'}
            </p>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[240px] overflow-y-auto -mx-1 px-1 space-y-1.5">
              {loadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun client trouvé</p>
                </div>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(
                      selectedClient?.id === client.id ? null : client
                    )}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg border p-3 transition-all text-left',
                      selectedClient?.id === client.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card/50 hover:bg-card/80 hover:border-primary/30'
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {client.type === 'company' ? (
                        <Building2 className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {client.displayName}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Billing type */}
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Type de facturation</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBillingType('quick')}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 text-left transition-all',
                    billingType === 'quick'
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card/50 hover:bg-card/80 hover:border-primary/20'
                  )}
                >
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', billingType === 'quick' ? 'bg-amber-500/15' : 'bg-amber-500/10')}>
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Rapide</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Montant global</p>
                  </div>
                  {billingType === 'quick' && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />}
                </button>
                <button
                  onClick={() => setBillingType('detailed')}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 text-left transition-all',
                    billingType === 'detailed'
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card/50 hover:bg-card/80 hover:border-primary/20'
                  )}
                >
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', billingType === 'detailed' ? 'bg-indigo-500/15' : 'bg-indigo-500/10')}>
                    <ClipboardList className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Complet</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Lignes détaillées</p>
                  </div>
                  {billingType === 'detailed' && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />}
                </button>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Mode de paiement</p>
              <div className="flex gap-1.5">
                {([
                  { id: 'bank_transfer' as const, label: 'Virement', Icon: Landmark, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { id: 'cash' as const, label: 'Espèces', Icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { id: 'other' as const, label: 'Carte', Icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ]).map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all',
                      paymentMethod === pm.id
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:bg-muted/50 hover:border-primary/20'
                    )}
                  >
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', pm.bg)}>
                      <pm.Icon className={cn('h-3.5 w-3.5', pm.color)} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options (collapsible) */}
            <div className="mt-3 rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
              >
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground flex-1">Options avancées</span>
                {showOptions
                  ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                }
              </button>

              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                      {/* Include subject */}
                      <label
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => setAiOptions(p => ({ ...p, includeSubject: !p.includeSubject }))}
                      >
                        <div className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center transition-all shrink-0',
                          aiOptions.includeSubject ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/40'
                        )}>
                          {aiOptions.includeSubject && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">Objet du document</p>
                          <p className="text-[10px] text-muted-foreground">Générer un objet descriptif</p>
                        </div>
                      </label>

                      {/* Acceptance conditions */}
                      <label
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => setAiOptions(p => ({ ...p, includeAcceptanceConditions: !p.includeAcceptanceConditions }))}
                      >
                        <div className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center transition-all shrink-0',
                          aiOptions.includeAcceptanceConditions ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/40'
                        )}>
                          {aiOptions.includeAcceptanceConditions && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">Conditions d&apos;acceptation</p>
                          <p className="text-[10px] text-muted-foreground">Générer des conditions contractuelles</p>
                        </div>
                      </label>

                      {/* VAT exempt */}
                      <label
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => setAiOptions(p => ({ ...p, vatExempt: !p.vatExempt }))}
                      >
                        <div className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center transition-all shrink-0',
                          aiOptions.vatExempt ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/40'
                        )}>
                          {aiOptions.vatExempt && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">Exonéré de TVA</p>
                          <p className="text-[10px] text-muted-foreground">TVA à 0% sur toutes les lignes</p>
                        </div>
                      </label>

                      {/* VAT exempt reason */}
                      <AnimatePresence>
                        {aiOptions.vatExempt && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-6.5 space-y-1 pt-1">
                              {([
                                { id: 'not_subject' as const, label: 'Non assujetti (Art. 293 B CGI)' },
                                { id: 'france_no_vat' as const, label: 'Exonéré (Art. 261 CGI)' },
                                { id: 'outside_france' as const, label: 'Hors France (Art. 259-1 CGI)' },
                              ]).map((r) => (
                                <button
                                  key={r.id}
                                  onClick={() => setAiOptions(p => ({ ...p, vatExemptReason: r.id }))}
                                  className={cn(
                                    'w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] transition-all',
                                    aiOptions.vatExemptReason === r.id
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                  )}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('prompt')}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
              </Button>
              <Button className="flex-1 gap-2" onClick={handleGenerate} disabled={!selectedClient}>
                <Wand2 className="h-4 w-4" /> Générer
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="py-8"
          >
            <div className="flex flex-col items-center text-center">
              {/* Galaxy AI animation */}
              <div className="relative h-32 w-32 mb-6">
                {/* Glow backdrop */}
                <motion.div
                  className="absolute -inset-4 rounded-full blur-2xl"
                  style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)' }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Ring 1 — outermost */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '1.5px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.1), rgba(59,130,246,0.6)) border-box',
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />

                {/* Ring 2 */}
                <motion.div
                  className="absolute inset-2 rounded-full"
                  style={{
                    border: '1.5px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(225deg, rgba(236,72,153,0.5), rgba(139,92,246,0.1), rgba(99,102,241,0.5)) border-box',
                  }}
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />

                {/* Ring 3 */}
                <motion.div
                  className="absolute inset-4 rounded-full"
                  style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(45deg, rgba(59,130,246,0.6), rgba(139,92,246,0.1), rgba(236,72,153,0.6)) border-box',
                  }}
                  animate={{ rotate: [0, -360] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                />

                {/* Ring 4 */}
                <motion.div
                  className="absolute inset-6 rounded-full"
                  style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(315deg, rgba(139,92,246,0.5), rgba(236,72,153,0.1), rgba(59,130,246,0.5)) border-box',
                  }}
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />

                {/* Ring 5 — innermost ring */}
                <motion.div
                  className="absolute inset-8 rounded-full"
                  style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(180deg, rgba(236,72,153,0.4), rgba(99,102,241,0.1), rgba(139,92,246,0.4)) border-box',
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />

                {/* Inner gradient orb */}
                <motion.div
                  className="absolute inset-10 rounded-full"
                  animate={{
                    background: [
                      'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
                    ],
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Sparkles className="h-7 w-7 text-purple-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  </motion.div>
                </div>

                {/* 10 Floating particles */}
                {[...Array(10)].map((_, i) => {
                  const angle = (i * 36 * Math.PI) / 180
                  const radius = 56 + (i % 3) * 8
                  const size = 1 + (i % 3) * 0.75
                  const colors = ['bg-purple-400/70', 'bg-indigo-400/70', 'bg-blue-400/70', 'bg-pink-400/70']
                  return (
                    <motion.div
                      key={i}
                      className={`absolute rounded-full ${colors[i % colors.length]}`}
                      style={{
                        width: size,
                        height: size,
                        top: '50%',
                        left: '50%',
                      }}
                      animate={{
                        x: [0, Math.cos(angle) * radius, Math.cos(angle + 0.5) * (radius * 0.6), 0],
                        y: [0, Math.sin(angle) * radius, Math.sin(angle + 0.5) * (radius * 0.6), 0],
                        opacity: [0, 0.8, 1, 0],
                        scale: [0, 1.2, 0.8, 0],
                      }}
                      transition={{
                        duration: 2.5 + (i % 3) * 0.5,
                        repeat: Infinity,
                        delay: i * 0.25,
                        ease: 'easeInOut',
                      }}
                    />
                  )
                })}
              </div>

              {/* Text with ShinyText */}
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ShinyText
                  text="Génération en cours..."
                  className="text-lg font-semibold"
                  color="#a78bfa"
                  shineColor="#e0e7ff"
                  speed={1.5}
                />
              </motion.div>
              <p className="text-sm text-muted-foreground mt-1">
                L&apos;IA prépare votre {docLabel}
              </p>

              {/* Indeterminate progress bar */}
              <div className="w-48 h-1 rounded-full bg-muted/30 mt-5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, rgba(139,92,246,0.8), rgba(99,102,241,0.8), rgba(59,130,246,0.8), rgba(236,72,153,0.8))',
                    backgroundSize: '200% 100%',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                    backgroundPosition: ['0% 0%', '100% 0%'],
                  }}
                  transition={{
                    x: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
