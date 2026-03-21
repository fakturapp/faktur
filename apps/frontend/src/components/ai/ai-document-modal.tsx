'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
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
} from 'lucide-react'
import { ShinyText } from '@/components/ui/shiny-text'

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
  const [step, setStep] = useState<'prompt' | 'client' | 'generating'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)
  const [generating, setGenerating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!open) {
      setStep('prompt')
      setPrompt('')
      setSelectedClient(null)
      setClientSearch('')
      setClients([])
    }
  }, [open])

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

    const { data, error } = await api.post<{
      document: {
        subject: string
        lines: { description: string; quantity: number; unitPrice: number; vatRate: number }[]
        notes?: string
        acceptanceConditions?: string
      }
    }>('/ai/generate-document', {
      type,
      prompt: prompt.trim(),
      clientId: selectedClient?.id,
    })

    setGenerating(false)

    if (error || !data?.document) {
      toast(error || 'Erreur lors de la génération', 'error')
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
              Optionnel — le client sera associé au document généré
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

            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('prompt')}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
              </Button>
              <Button className="flex-1 gap-2" onClick={handleGenerate}>
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
